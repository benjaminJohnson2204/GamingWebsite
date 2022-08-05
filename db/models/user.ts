import mongoose from "mongoose";
import { IDocument } from "./document";

interface IUser extends IDocument {
  username: string;
  password: string;
}

const userSchema = new mongoose.Schema<IUser>({
  username: String,
  password: String,
});
const User = mongoose.model<IUser>("User", userSchema);

export { User, IUser };
