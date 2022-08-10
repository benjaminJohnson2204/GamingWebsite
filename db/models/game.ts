import mongoose from "mongoose";
import { IDocument } from "./document";
import { GameType } from "./gameType";

const ObjectId = mongoose.Types.ObjectId;

interface IGame extends IDocument {
  type: mongoose.Types.ObjectId;
  userIds: mongoose.Types.ObjectId[];
  usernames: string[];
  complete: boolean;
  winner: mongoose.Types.ObjectId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  score: any;
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
