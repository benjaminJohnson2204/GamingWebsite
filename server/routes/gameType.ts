import express, { Request, Response } from "express";
import { GameType, IGameType } from "../../db/models/gameType";

const router = express.Router();

router.get("/all", async (req: Request, res: Response) => {
  const gameTypes = await GameType.find({});
  res.status(200).json(gameTypes);
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
