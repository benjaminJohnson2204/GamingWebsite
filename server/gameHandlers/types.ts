import { ObjectId } from "mongoose";
import type { Server, Socket } from "socket.io";
import { IGame } from "../../db/models/game";

interface GameHandlerParameters {
  socket: Socket;
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  socketNamespace: string;
}

interface RoomHandlerParameters extends GameHandlerParameters {
  gameTypeId: ObjectId;
  inProgressGames: Map<string, IGame>;
}

interface ServerToClientEvents {
  joinedGame: (game: IGame) => void;
  gameUpdate: (game: IGame) => void;
}

interface ClientToServerEvents {
  joinRandomGame: (userId: ObjectId) => void;
  createPrivateGame: (userId: ObjectId) => void;
  joinPrivateGame: (userId: ObjectId, userToJoin: ObjectId) => void;
  joinRoom: (gameId: ObjectId) => void;
  move: (gameId: ObjectId, userId: ObjectId, row: number, col: number) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {}

export {
  GameHandlerParameters,
  RoomHandlerParameters,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
};
