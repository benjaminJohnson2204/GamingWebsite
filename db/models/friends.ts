import mongoose from "mongoose";
import { IDocument } from "./document";

const ObjectId = mongoose.Schema.Types.ObjectId;
import { User } from "./user";

interface IFriendship extends IDocument {
  userIds: mongoose.Types.ObjectId[];
}
const friendshipSchema = new mongoose.Schema<IFriendship>({
  userIds: [{ type: ObjectId, ref: User }],
});
const Friendship = mongoose.model<IFriendship>("Friendship", friendshipSchema);

interface IFriendRequest extends IDocument {
  requestingUser: mongoose.Types.ObjectId;
  requestedUser: mongoose.Types.ObjectId;
}
const friendRequestSchema = new mongoose.Schema<IFriendRequest>({
  requestingUser: { type: ObjectId, ref: User },
  requestedUser: { type: ObjectId, ref: User },
});
const FriendRequest = mongoose.model<IFriendRequest>("FriendRequest", friendRequestSchema);

export { Friendship, FriendRequest, IFriendship, IFriendRequest };
