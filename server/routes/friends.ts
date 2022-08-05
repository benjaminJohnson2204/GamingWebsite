import { FriendRequest, Friendship, IFriendRequest, IFriendship } from "../../db/models/friends";
import { ensureAuthenticated } from "./auth";
import { Request, Response } from "express";
import { IUser } from "../../db/models/user";

const router = require("express").Router();

router.use("*", ensureAuthenticated);

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
 *  View all pending friend requests
 */
router.get("/request", async (req: Request, res: Response) => {
  const requests: IFriendRequest[] = await FriendRequest.find({
    receivingUser: (req.user as IUser)._id,
  });
  return res.status(200).json({ requests: requests });
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
 * View all a user's friends
 */
router.get("/all", async (req: Request, res: Response) => {
  const friendships = await Friendship.find({ userIds: (req.user as IUser)._id });
  return res.status(200).json({ friendships: friendships });
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
