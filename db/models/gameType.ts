import mongoose from "mongoose";
import { IDocument } from "./document";

interface IGameType extends IDocument {
  name: string;
  socketNamespace: string;
  description: string;
  numPlayers: number;
}

const gameTypeSchema = new mongoose.Schema<IGameType>({
  name: String,
  socketNamespace: String,
  description: String,
  numPlayers: Number,
});
const GameType = mongoose.model<IGameType>("GameType", gameTypeSchema);

export { GameType, IGameType };
