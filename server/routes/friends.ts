import { FriendRequest, Friendship, IFriendRequest, IFriendship } from "../../db/models/friends";
import { ensureAuthenticated } from "./auth";
import { Request, Response } from "express";
import { IUser, User } from "../../db/models/user";
import mongoose from "mongoose";

const router = require("express").Router();

router.use("*", ensureAuthenticated);

/**
 * Search for users (case-insensitive) to add them as friends
 * Req.query contains "search" for what to search for
 */
router.get("/search", async (req: Request, res: Response) => {
  const users = await User.find({
    username: {
      $ne: (req.user as IUser).username,
      $regex: new RegExp((req.query.search as string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      $options: "i",
    },
  });
  const userData = [];
  for (let user of users) {
    const data: any = { user: user };
    const friendship: IFriendship | null = await Friendship.findOne({
      userIds: { $all: [(req.user as IUser)._id, user._id] },
    });
    data["friends"] = friendship !== null;

    const requested: IFriendRequest | null = await FriendRequest.findOne({
      requestingUser: (req.user as IUser)._id,
      requestedUser: user._id,
    });
    data["requested"] = requested !== null;

    const requesting: IFriendRequest | null = await FriendRequest.findOne({
      requestingUser: user._id,
      requestedUser: (req.user as IUser)._id,
    });
    data["requesting"] = requesting !== null;
    userData.push(data);
  }
  return res.status(200).json({ users: userData });
});

/**
 * Make a friend request to another user
 * Req.body contains userId, the ID of the user to make a request to
 */
router.post("/request", async (req: Request, res: Response) => {
  const existingFriendship: IFriendship | null = await Friendship.findOne({
    userIds: { $all: [(req.user as IUser)._id, req.body.userId] },
  });
  if (existingFriendship) {
    return res.status(400).json({ error: "You are already friends with that user" });
  }

  const existingRequest: IFriendRequest | null = await FriendRequest.findOne({
    requestingUser: (req.user as IUser)._id,
    requestedUser: req.body.userId,
  });
  if (existingRequest) {
    return res.status(400).json({ error: "You have already sent a friend request to that user" });
  }

  const request: IFriendRequest = await FriendRequest.create({
    requestingUser: (req.user as IUser)._id,
    requestedUser: req.body.userId,
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
  const requestingUserIds: mongoose.Types.ObjectId[] = (
    await FriendRequest.find({
      requestedUser: (req.user as IUser)._id,
    })
  ).map((doc) => doc.requestingUser);

  const requestingUsers = await User.find({
    _id: requestingUserIds,
  });
  return res.status(200).json({ requestingUsers: requestingUsers });
});

/**
 *  View all outgoing friend requests
 */
router.get("/request/outgoing", async (req: Request, res: Response) => {
  const requestedUserIds: mongoose.Types.ObjectId[] = (
    await FriendRequest.find({
      requestingUser: (req.user as IUser)._id,
    })
  ).map((doc) => doc.requestedUser);

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
    requestedUser: (req.user as IUser)._id,
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
  return res.status(200).json({ result: "Successfully accepted friend request" });
});

/**
 * Decline a friend request
 * Req.body contains userId, the ID of the user whose request to decline
 */
router.post("/decline", async (req: Request, res: Response) => {
  const request: IFriendRequest | null = await FriendRequest.findOne({
    requestingUser: req.body.userId,
    requestedUser: (req.user as IUser)._id,
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
    requestedUser: req.body.userId,
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
  const friendIds: mongoose.Types.ObjectId[] = (
    await Friendship.find({
      userIds: (req.user as IUser)._id,
    })
  ).map((doc) => doc.userIds.filter((_id) => !_id.equals((req.user as IUser)._id))[0]);

  // Find all users involved in those friendships, excluding this user themself
  const friends: IUser[] = await User.find({
    _id: { $in: friendIds },
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
  return res.status(200).json({ result: "Successfully removed friend" });
});

export { router };
