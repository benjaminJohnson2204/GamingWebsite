import { Request, Response } from "express";
import { Game } from "../../db/models/game";
import { GameType } from "../../db/models/gameType";
import { IUser } from "../../db/models/user";
import { ensureAuthenticated } from "./auth";

const router = require("express").Router();

router.use("*", ensureAuthenticated);

/**
 * Get all games the user has played
 */
router.get("/all", async (req: Request, res: Response) => {
  const games = await Game.find({ complete: true, userIds: (req.user as IUser)._id });
  res.status(200).json({ games: games });
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

export { router };
