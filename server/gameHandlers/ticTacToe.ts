import mongoose from "mongoose";
import { Game, IGame } from "../../db/models/game";
import { GameHandlerParameters } from "./types";
import handleRooms from "./handleRooms";

export interface TicTacToeGame extends IGame {
  squares: string[][]; // Store squares as empty strings, "X", or "O"
  xPlayer: mongoose.Types.ObjectId;
  turn: string; // "X" or "O"
}

const flipACoin = () => Math.random() < 0.5;

const switchTurns = (game: TicTacToeGame) => {
  if (game.turn === "X") {
    game.turn = "O";
  } else {
    game.turn = "X";
  }
  return game;
};

const checkForWinner = (game: TicTacToeGame) => {
  let winner = null;
  for (let i = 0; i < 3; i++) {
    // Rows
    if (game.squares[i][0] === game.squares[i][1] && game.squares[i][0] === game.squares[i][2]) {
      winner = game.squares[i][0];
      break;
    }
    // Columns
    if (game.squares[0][i] === game.squares[1][i] && game.squares[0][i] === game.squares[2][i]) {
      winner = game.squares[i];
      break;
    }
  }
  // Diagonals
  if (game.squares[0][0] === game.squares[1][1] && game.squares[0][0] === game.squares[2][2]) {
    winner = game.squares[1][1];
  } else if (
    game.squares[2][0] === game.squares[1][1] &&
    game.squares[2][0] === game.squares[0][2]
  ) {
    winner = game.squares[1][1];
  }
  return winner;
};

const checkForTie = (game: TicTacToeGame) => {
  for (const row of game.squares) {
    for (const square of row) {
      if (!square) {
        return false;
      }
    }
  }
  return true;
};

export default function ticTacToeHandler({
  socket,
  io,
  waitingRandomUsers,
  waitingPrivateUsers,
  inProgressGames,
  socketNamespace,
}: GameHandlerParameters) {
  const gameTypeId = new mongoose.Schema.Types.ObjectId("62ecb1695918d6b6bab9f988");

  handleRooms({
    socket,
    io,
    waitingRandomUsers,
    waitingPrivateUsers,
    inProgressGames,
    socketNamespace,
    gameTypeId,
  });

  socket.on("joinRoom", (gameId) => {
    socket.join(gameId);
    const game = inProgressGames.get(gameId);
    if (!Object.prototype.hasOwnProperty.call(game, "squares")) {
      game.squares = [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
      ];
      game.xPlayer = flipACoin() ? game.userIds[0] : game.userIds[1];
      game.turn = "X";
    }
    io.of(socketNamespace).to(game._id.toString()).emit("gameUpdate", game);
  });

  socket.on("move", (gameId, userId, row, col) => {
    const game = inProgressGames.get(gameId);
    const playersLetter = userId === game.xPlayer ? "X" : "O";

    // Ensure that it's this user's turn and the square is available
    if (playersLetter !== game.turn || game.squares[row][col]) {
      return;
    }

    game.squares[row][col] = playersLetter;
    const winner = checkForWinner(game);
    if (winner) {
      game.winner =
        winner === "X"
          ? game.xPlayer
          : game.userIds.filter((id: mongoose.Types.ObjectId) => id !== game.xPlayer)[0];
      game.complete = true;
      Game.updateOne({ _id: game._id }, { complete: true, winner: game.winner });
    } else if (checkForTie(game)) {
      game.complete = true;
      Game.updateOne({ _id: game._id }, { complete: true });
    } else {
      switchTurns(game);
    }
    io.of(socketNamespace).to(game._id.toString()).emit("gameUpdate", game);
  });
}
