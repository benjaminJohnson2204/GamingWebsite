import { ObjectId } from "mongoose";
import { Game, IGame } from "../../db/models/game";
import { GameType } from "../../db/models/gameType";
import { GameHandlerParameters } from "./types";

export interface TicTacToeGame extends IGame {
  squares: String[][]; // Store squares as empty strings, "X", or "O"
  xPlayer: ObjectId;
  turn: String; // "X" or "O"
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
  if (game.squares[0][0] === game.squares[1][1] && game.squares[0][0] === game.squares[3][3]) {
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
  for (let row of game.squares) {
    for (let square of row) {
      if (!square) {
        return false;
      }
    }
  }
  return true;
};

module.exports = ({
  socket,
  io,
  waitingRandomUsers,
  waitingPrivateUsers,
  inProgressGames,
  socketNamespace,
}: GameHandlerParameters) => {
  const gameTypeId = "62ecb1695918d6b6bab9f988";

  require("./handleRooms")({
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
    const game = inProgressGames.get(gameId) as TicTacToeGame;
    game.squares = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
    game.xPlayer = flipACoin() ? game.userIds[0] : game.userIds[1];
    game.turn = "X";
  });

  socket.on("move", (gameId, userId, row, col) => {
    const game = inProgressGames.get(gameId) as TicTacToeGame;
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
          : game.userIds.filter((id: ObjectId) => id !== game.xPlayer)[0];
      Game.updateOne({ _id: game._id }, { completed: true, winner: game.winner });
    } else if (checkForTie(game)) {
      Game.updateOne({ _id: game._id }, { completed: true });
    } else {
      switchTurns(game);
    }
    io.of(socketNamespace).to(game._id.toString()).emit("gameUpdate", game);
  });
};
