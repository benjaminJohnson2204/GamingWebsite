import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { Game } from "../../db/models/game";
import { GameType } from "../../db/models/gameType";
import { IUser } from "../../db/models/user";
import { availableColors } from "../gameHandlers/dotsAndBoxes";
import { ensureAuthenticated } from "./auth";

const router = express.Router();

router.use("*", ensureAuthenticated);

/**
 * Get all games the user has played
 */
router.get("/all", async (req: Request, res: Response) => {
  const games = await Game.find({ complete: true, userIds: (req.user as IUser)._id });
  res.status(200).json({ games: games });
});

router.get("/dots-and-boxes/colors", (req: Request, res: Response) => {
  res.status(200).json(availableColors);
});

/**
 * Get all games of a certain type that the user has played
 */
router.get("/:gameTypeId", async (req: Request, res: Response) => {
  const games = await Game.find({
    complete: true,
    type: req.params.gameTypeId,
    userIds: (req.user as IUser)._id,
  });
  res.status(200).json({ games: games });
});

router.post("/add", async (req: Request, res: Response) => {
  const gameType = await GameType.findOne({
    socketNamespace: req.body.gameType,
  });
  if (!gameType) {
    return res.status(400).json("Game type does not exist");
  }
  const game = await Game.create({
    type: gameType._id,
    userIds: [(req.user as IUser)._id],
    usernames: [(req.user as IUser).username],
    complete: true,
    score: req.body.score,
  });
  if (game) {
    res.status(200).json({ game: game });
  } else {
    res.status(500).json("Cannot add game");
  }
});

export { router };
