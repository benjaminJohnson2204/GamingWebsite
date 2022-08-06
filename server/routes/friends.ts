import { FriendRequest, Friendship, IFriendRequest, IFriendship } from "../../db/models/friends";
import { ensureAuthenticated } from "./auth";
import { Request, Response } from "express";
import { IUser, User } from "../../db/models/user";
import { ObjectId } from "mongoose";

const router = require("express").Router();

router.use("*", ensureAuthenticated);

/**
 * Search for users (case-insensitive) to add them as friends
 * Req.query contains "search" for what to search for
 */
router.get("/search", async (req: Request, res: Response) => {
  const users = await User.find({
    username: {
      $regex: new RegExp((req.query.search as string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      $options: "i",
    },
  });
  return res.status(200).json({ users: users });
});

/**
 * Make a friend request to another user
 * Req.body contains userId, the ID of the user to make a request to
 */
router.post("/request", async (req: Request, res: Response) => {
  const request: IFriendRequest = await FriendRequest.create({
    requestingUser: (req.user as IUser)._id,
    receivingUser: req.body.userId,
  });
  if (!request) {
    return res.status(500).json({ error: "Cannot create friend request" });
  }
  return res.status(201).json({ request: request });
});

/**
 *  View all incoming friend requests
 */
router.get("/request/incoming", async (req: Request, res: Response) => {
  const requestingUserIds: IFriendRequest[] = await FriendRequest.find({
    receivingUser: (req.user as IUser)._id,
  }).select("requestingUser");
  const requestingUsers = await User.find({
    _id: requestingUserIds,
  });
  return res.status(200).json({ requestingUsers: requestingUsers });
});

/**
 *  View all outgoing friend requests
 */
router.get("/request/outgoing", async (req: Request, res: Response) => {
  const requestedUserIds: IFriendRequest[] = await FriendRequest.find({
    requestingUser: (req.user as IUser)._id,
  }).select("receivingUser");
  const requestedUsers = await User.find({
    _id: requestedUserIds,
  });
  return res.status(200).json({ requestedUsers: requestedUsers });
});

/**
 * Accept a friend request
 * Req.body contains userId, the ID of the user whose request to accept
 */
router.post("/accept", async (req: Request, res: Response) => {
  const request: IFriendRequest | null = await FriendRequest.findOne({
    requestingUser: req.body.userId,
    receivingUser: (req.user as IUser)._id,
  });
  if (!request) {
    return res.status(400).json({ error: "That user has not made a friend request to you" });
  }
  const friendship: IFriendship = await Friendship.create({
    userIds: [(req.user as IUser)._id, req.body.userId],
  });
  if (!friendship) {
    return res.status(500).json({ error: "Cannot add friend" });
  }
  await FriendRequest.deleteOne({ _id: request._id });
  return res.status(204);
});

/**
 * Decline a friend request
 * Req.body contains userId, the ID of the user whose request to decline
 */
router.post("/decline", async (req: Request, res: Response) => {
  const request: IFriendRequest | null = await FriendRequest.findOne({
    requestingUser: req.body.userId,
    receivingUser: (req.user as IUser)._id,
  });
  if (!request) {
    return res.status(400).json({ error: "That user has not made a friend request to you" });
  }
  await FriendRequest.deleteOne({ _id: request._id });
  return res.status(200).json({ result: "Successfully declined friend request" });
});

/**
 * Cancel a friend request to another user
 * Req.body contains userId, the ID of the user to cancel a request to
 */
router.post("/cancel", async (req: Request, res: Response) => {
  const request: IFriendRequest | null = await FriendRequest.findOne({
    requestingUser: (req.user as IUser)._id,
    receivingUser: req.body.userId,
  });
  if (!request) {
    return res.status(400).json({ error: "You have not made a friend request to that user" });
  }
  await FriendRequest.deleteOne({ _id: request._id });
  return res.status(200).json({ result: "Successfully canceled friend request" });
});

/**
 * View all a user's friends
 */
router.get("/all", async (req: Request, res: Response) => {
  // Find all friendships involving this user
  const friendIds = await Friendship.find({
    userIds: (req.user as IUser)._id,
  }).select("userIds");

  // Find all users involved in those friendships, excluding this user themself
  const friends: IUser[] = await User.find({
    _id: { $ne: (req.user as IUser)._id, $in: friendIds },
  });
  return res.status(200).json({ friends: friends });
});

/**
 * Remove a friend
 * Req.body contains userId, the ID of the user to remove as a friend
 */
router.post("/remove", async (req: Request, res: Response) => {
  await Friendship.deleteOne({
    userIds: {
      $all: [(req.user as IUser)._id, req.body.userId],
    },
  });
  return res.status(204);
});

export { router };
