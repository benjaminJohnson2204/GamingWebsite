import { Request, Response } from "express";
import { GameType } from "../../db/models/gameType";

const router = require("express").Router();

router.get("/all", async (req: Request, res: Response) => {
  const gameTypes = await GameType.find({});
  res.status(200).json({ gameTypes: gameTypes });
});

export { router };
