import { ObjectId } from "mongoose";
import type { Server, Socket } from "socket.io";

interface GameHandlerParameters {
  socket: Socket;
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  waitingRandomUsers: Set<string>;
  waitingPrivateUsers: Map<string, string>;
  inProgressGames: Map<string, any>;
  socketNamespace: string;
}

interface RoomHandlerParameters extends GameHandlerParameters {
  gameTypeId: ObjectId;
}

interface ServerToClientEvents {
  joinedGame: (game: any) => void;
  gameUpdate: (game: any) => void;
}

interface ClientToServerEvents {
  joinRandomGame: (userId: string) => void;
  createPrivateGame: (userId: string, opponentId: string) => void;
  joinPrivateGame: (userId: string, userToJoin: string) => void;
  joinRoom: (gameId: string) => void;
  move: (gameId: string, userId: string, row: number, col: number) => void;
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
