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
import mongoose, { ObjectId } from "mongoose";

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

dotenv.config({ path: ".env" });
const port = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  server
);

export const connectToMongoose = async () => {
  await mongoose.connect(process.env.MONGO_URI!);
};

if (process.env.TEST_ENV?.trim() !== "TRUE") {
  connectToMongoose(); // Need to delay connecting for tests because those change the Mongo URI
}

app.use(express.static(path.resolve(__dirname, "../../client/build")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: Express.User, done: Function) => {
  done(null, (user as IUser)._id);
});

passport.deserializeUser(async (id: ObjectId, done: Function) => {
  const user: IUser | null = await User.findById(id);
  return done(null, user);
});

passport.use(
  new LocalStrategy(async (username: string, password: string, done: Function) => {
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
  require("./gameHandlers/ticTacToe")({ socket, io });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

export default app;
