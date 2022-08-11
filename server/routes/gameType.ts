import express, { Request, Response } from "express";
import { globalWaitingPrivateUsers } from "..";
import { GameType, IGameType } from "../../db/models/gameType";
import { IUser, User } from "../../db/models/user";
import { ensureAuthenticated } from "./auth";

const router = express.Router();

export interface IGameRequest {
  opponent: IUser;
  gameType: IGameType;
}

router.get("/all", async (req: Request, res: Response) => {
  const gameTypes = await GameType.find({});
  res.status(200).json(gameTypes);
});

router.get("/requests", ensureAuthenticated, async (req: Request, res: Response) => {
  const requests = [];
  const gameTypes = await GameType.find({});
  for (const gameType of gameTypes) {
    const waitingPrivateUsers = globalWaitingPrivateUsers.get(gameType.socketNamespace);
    if (waitingPrivateUsers) {
      for (const waitingPrivateUser of waitingPrivateUsers) {
        if (waitingPrivateUser[1] === (req.user as IUser)._id.toString()) {
          const opponent = await User.findById(waitingPrivateUser[0]);
          requests.push({ opponent: opponent, gameType: gameType });
        }
      }
    }
  }
  res.status(200).json(requests);
});

router.get("/:gameType", async (req: Request, res: Response) => {
  const gameType: IGameType | null = await GameType.findOne({
    socketNamespace: req.params.gameType,
  });
  if (gameType) {
    res.status(200).json(gameType);
  } else {
    res.status(404).json({ error: "Game type does not exist" });
  }
});

export { router };
