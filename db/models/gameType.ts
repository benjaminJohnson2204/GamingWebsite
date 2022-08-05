import mongoose from "mongoose";
import { IDocument } from "./document";

interface IGameType extends IDocument {
  name: string;
  description: string;
  numPlayers: Number;
}

const gameTypeSchema = new mongoose.Schema<IGameType>({
  name: String,
  description: String,
  numPlayers: Number,
});
const GameType = mongoose.model<IGameType>("GameType", gameTypeSchema);

export { GameType, IGameType };
