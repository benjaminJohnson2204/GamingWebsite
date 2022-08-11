import mongoose from "mongoose";
import { Game, IGame } from "../../db/models/game";
import { GameHandlerParameters } from "./types";
import handleRooms from "./handleRooms";

// Board size
const boxesAcross = 6;
const boxesDown = 4;

export const availableColors = ["red", "green", "blue", "yellow", "purple", "orange", "cyan"];

export interface DotsAndBoxesGame extends IGame {
  boxes: mongoose.Types.ObjectId[][];
  horizontalLines: boolean[][];
  verticalLines: boolean[][];
  fristPlayer: mongoose.Types.ObjectId;
  turn: mongoose.Types.ObjectId;
  colors: string[];
}

const flipACoin = () => Math.random() < 0.5;

const switchTurns = (game: DotsAndBoxesGame) => {
  game.turn = game.userIds.filter((id) => id !== game.turn)[0];
  return game;
};

const placeLine = (
  game: DotsAndBoxesGame,
  userId: mongoose.Types.ObjectId,
  row: number,
  col: number,
  horizontal: boolean
) => {
  let placedBox = false;
  if (horizontal) {
    game.horizontalLines[row][col] = true;
    if (
      row < game.horizontalLines.length - 1 &&
      game.horizontalLines[row + 1][col] &&
      game.verticalLines[row][col] &&
      game.verticalLines[row][col + 1]
    ) {
      game.boxes[row][col] = userId;
      placedBox = true;
    }
    if (
      row > 0 &&
      game.horizontalLines[row - 1][col] &&
      game.verticalLines[row - 1][col] &&
      game.verticalLines[row - 1][col + 1]
    ) {
      game.boxes[row - 1][col] = userId;
      placedBox = true;
    }
  } else {
    game.verticalLines[row][col] = true;
    if (
      col < game.verticalLines[0].length - 1 &&
      game.verticalLines[row][col + 1] &&
      game.horizontalLines[row][col] &&
      game.horizontalLines[row + 1][col]
    ) {
      game.boxes[row][col] = userId;
      placedBox = true;
    }
    if (
      col > 0 &&
      game.verticalLines[row][col - 1] &&
      game.horizontalLines[row][col - 1] &&
      game.horizontalLines[row + 1][col - 1]
    ) {
      game.boxes[row][col - 1] = userId;
      placedBox = true;
    }
  }
  return placedBox;
};

const checkForWinner = (game: DotsAndBoxesGame) => {
  const counts = new Map<mongoose.Types.ObjectId, number>();
  let full = true;

  for (const row of game.boxes) {
    for (const box of row) {
      if (!box) {
        full = false;
        break;
      }
      counts.set(box, (counts.get(box) || 0) + 1);
    }
  }

  const winner =
    (counts.get(game.userIds[0]) || 0) > (counts.get(game.userIds[1]) || 0)
      ? game.userIds[0]
      : (counts.get(game.userIds[1]) || 0) > (counts.get(game.userIds[0]) || 0)
      ? game.userIds[1]
      : null;

  return {
    full: full,
    winner: winner,
  };
};

export default function dotsAndBoxesHandler({
  socket,
  io,
  waitingRandomUsers,
  waitingPrivateUsers,
  inProgressGames,
  socketNamespace,
}: GameHandlerParameters) {
  const gameTypeId = new mongoose.Types.ObjectId("62f42872716a9be2ae46bc80");

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
    if (!game) {
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(game, "boxes")) {
      game.boxes = [];
      for (let i = 0; i < boxesDown; i++) {
        const row = [];
        for (let j = 0; j < boxesAcross; j++) {
          row.push("");
        }
        game.boxes.push(row);
      }

      game.horizontalLines = [];
      for (let i = 0; i <= boxesDown; i++) {
        const row = [];
        for (let j = 0; j < boxesAcross; j++) {
          row.push(false);
        }
        game.horizontalLines.push(row);
      }

      game.verticalLines = [];
      for (let i = 0; i < boxesDown; i++) {
        const row = [];
        for (let j = 0; j <= boxesAcross; j++) {
          row.push(false);
        }
        game.verticalLines.push(row);
      }

      game.firstPlayer = flipACoin() ? game.userIds[0] : game.userIds[1];
      game.turn = game.firstPlayer;

      const shuffledColors = availableColors.sort(() => 0.5 - Math.random());
      game.colors = shuffledColors.slice(0, 2);
    }
    io.of(socketNamespace).to(game._id.toString()).emit("gameUpdate", game);
  });

  socket.on("chooseColor", (gameId, userId, color) => {
    const game = inProgressGames.get(gameId);
    if (!game || !color) {
      return;
    }
    if (
      (availableColors.includes(color.toLowerCase()) || /^#[0-9a-f]{6}$/i.test(color)) &&
      color !== game.colors[game.userIds[0] === userId ? 1 : 0]
    ) {
      // Ensure that the color is valid and the user is not taking the same color as their opponent
      game.colors[game.userIds[0] === userId ? 0 : 1] = color;
      io.of(socketNamespace).to(game._id.toString()).emit("gameUpdate", game);
    }
  });

  socket.on("move", async (gameId, userId, row, col, horizontal) => {
    const game = inProgressGames.get(gameId);

    // Ensure that it's this user's turn and the line is available
    if (
      !game ||
      userId !== game.turn ||
      (horizontal ? game.horizontalLines[row][col] : game.verticalLines[row][col])
    ) {
      return;
    }
    const placedBox = placeLine(game, userId, row, col, horizontal);
    const { full, winner } = checkForWinner(game);
    let updatedGame;
    if (full) {
      if (winner) {
        game.winner = winner;
        game.complete = true;
        updatedGame = Game.updateOne({ _id: game._id }, { complete: true, winner: game.winner });
      } else {
        game.complete = true;
        updatedGame = Game.updateOne({ _id: game._id }, { complete: true });
      }
    } else if (!placedBox) {
      switchTurns(game);
    }
    io.of(socketNamespace).to(game._id.toString()).emit("gameUpdate", game);
    await updatedGame;
  });
}
