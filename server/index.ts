import path from "path";
import dotenv from "dotenv";
import express, { Request, Response, Express } from "express";
import http from "http";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { Socket, Server } from "socket.io";
import mongoose from "mongoose";

import { IUser } from "../db/models/user";

import { router as authRouter } from "./routes/auth";
import { router as friendsRouter } from "./routes/friends";
import { router as gameTypesRouter } from "./routes/gameType";
import { router as gameRouter } from "./routes/game";

import { User } from "../db/models/user";
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./gameHandlers/types";
import { IGame } from "../db/models/game";

import ticTacToeHandler from "./gameHandlers/ticTacToe";

dotenv.config({ path: ".env" });
const port = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  server
);

// Keys are namespaces, values are sets of waiting users
export const globalWaitingRandomUsers = new Map<string, Set<string>>();
export const globalWaitingPrivateUsers = new Map<string, Map<string, string>>(); // For each namespace, keys are creators and values are opponents
export const globalInProgressGames = new Map<string, Map<string, IGame>>();

globalWaitingRandomUsers.set("tic-tac-toe", new Set<string>());
globalWaitingPrivateUsers.set("tic-tac-toe", new Map<string, string>());
globalInProgressGames.set("tic-tac-toe", new Map<string, IGame>());

export const connectToMongoose = async () => {
  await mongoose.connect(process.env.MONGO_URI || "");
};

if (!process.argv.includes("--exit")) {
  connectToMongoose(); // Need to delay connecting for tests because those change the Mongo URI
}

app.use(express.static(path.resolve(__dirname, "../../client/build")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "",
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as IUser)._id);
});

passport.deserializeUser(async (id: mongoose.Types.ObjectId, done) => {
  const user: IUser | null = await User.findById(id);
  return done(null, user);
});

passport.use(
  new LocalStrategy(async (username: string, password: string, done) => {
    const user: IUser | null = await User.findOne({ username: username });
    if (!user) {
      return done(null, false);
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return done(null, false);
    }
    return done(null, user);
  })
);

app.use("/auth", authRouter);
app.use("/friend", friendsRouter);
app.use("/game-type", gameTypesRouter);
app.use("/game", gameRouter);

app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, "../../client/build", "index.html"));
});

io.of("/tic-tac-toe").on("connection", (socket: Socket) => {
  const socketNamespace = "tic-tac-toe";
  const waitingRandomUsers = globalWaitingRandomUsers.get(socketNamespace) || new Set();
  const waitingPrivateUsers = globalWaitingPrivateUsers.get(socketNamespace) || new Map();
  const inProgressGames = globalInProgressGames.get(socketNamespace) || new Map();
  ticTacToeHandler({
    socket,
    io,
    waitingRandomUsers,
    waitingPrivateUsers,
    inProgressGames,
    socketNamespace,
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

export default app;
