import mongoose from "mongoose";
import type { Server, Socket } from "socket.io";

interface GameHandlerParameters {
  socket: Socket;
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  waitingRandomUsers: Set<string>;
  waitingPrivateUsers: Map<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inProgressGames: Map<string, any>;
  socketNamespace: string;
}

interface RoomHandlerParameters extends GameHandlerParameters {
  gameTypeId: mongoose.Types.ObjectId;
}

interface ServerToClientEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  joinedGame: (game: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SocketData {}

export {
  GameHandlerParameters,
  RoomHandlerParameters,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
};
