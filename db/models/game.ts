import mongoose from "mongoose";
import { IDocument } from "./document";
import { GameType } from "./gameType";
import { User } from "./user";

const ObjectId = mongoose.Types.ObjectId;

interface IGame extends IDocument {
  type: mongoose.Schema.Types.ObjectId;
  userIds: mongoose.Schema.Types.ObjectId[];
  complete: Boolean;
  winner: mongoose.Schema.Types.ObjectId;
  score: Object;
}

const gameSchema = new mongoose.Schema<IGame>({
  type: { type: ObjectId, ref: GameType },
  userIds: [ObjectId],
  complete: Boolean,
  winner: ObjectId,
  score: Object,
});
const Game = mongoose.model<IGame>("Game", gameSchema);

export { Game, IGame };
