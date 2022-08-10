import mongoose from "mongoose";
import { IDocument } from "./document";
import { GameType } from "./gameType";
import { User } from "./user";

const ObjectId = mongoose.Types.ObjectId;

interface IGame extends IDocument {
  type: mongoose.Types.ObjectId;
  userIds: mongoose.Types.ObjectId[];
  usernames: string[];
  complete: Boolean;
  winner: mongoose.Types.ObjectId;
  score: Object;
}

const gameSchema = new mongoose.Schema<IGame>({
  type: { type: mongoose.Schema.Types.ObjectId, ref: GameType },
  userIds: [ObjectId],
  usernames: [String],
  complete: Boolean,
  winner: ObjectId,
  score: Object,
});
const Game = mongoose.model<IGame>("Game", gameSchema);

export { Game, IGame };
