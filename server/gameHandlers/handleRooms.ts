import { ObjectId } from "mongoose";
import { Game, IGame } from "../../db/models/game";
import { IUser, User } from "../../db/models/user";
import { RoomHandlerParameters } from "./types";

module.exports = ({
  socket,
  io,
  waitingRandomUsers,
  waitingPrivateUsers,
  inProgressGames,
  socketNamespace,
  gameTypeId,
}: RoomHandlerParameters) => {
  socket.on("joinRandomGame", async (userId) => {
    if (waitingRandomUsers.size > 0) {
      // Get first user (one who has been waiting the longest)
      let [userToJoin] = waitingRandomUsers.values();
      let user1: IUser | null = await User.findById(userId);
      let user2: IUser | null = await User.findById(userToJoin);
      if (!user1 || !user2) {
        return socket.emit("error", "One or both users does not exist");
      }
      let game: IGame = await Game.create({
        type: gameTypeId,
        userIds: [userId, userToJoin],
        usernames: [user1.username, user2.username],
        complete: false,
      });
      inProgressGames.set(game._id.toString(), {
        _id: game._id,
        type: gameTypeId,
        userIds: [userId, userToJoin],
        usernames: [user1.username, user2.username],
        complete: false,
      });
      waitingRandomUsers.delete(userToJoin);
      socket.join(game._id.toString());
      io.of(socketNamespace).to(game._id.toString()).emit("joinedGame", game);
      io.of(socketNamespace).to(userToJoin).emit("joinedGame", game);
    } else {
      waitingRandomUsers.add(userId);
      socket.join(userId);
    }
  });

  socket.on("createPrivateGame", (userId, opponentId) => {
    waitingPrivateUsers.set(userId, opponentId);
    socket.join(userId);
  });

  socket.on("joinPrivateGame", async (userId, userToJoin) => {
    if (waitingPrivateUsers.has(userToJoin)) {
      waitingPrivateUsers.delete(userToJoin);
      let user1: IUser | null = await User.findById(userId);
      let user2: IUser | null = await User.findById(userToJoin);
      if (!user1 || !user2) {
        return socket.emit("error", "One or both users does not exist");
      }
      let game: IGame = await Game.create({
        type: gameTypeId,
        userIds: [userId, userToJoin],
        usernames: [user1.username, user2.username],
        complete: false,
      });
      inProgressGames.set(game._id.toString(), {
        _id: game._id,
        type: gameTypeId,
        userIds: [userId, userToJoin],
        usernames: [user1.username, user2.username],
        complete: false,
      });
      socket.join(game._id.toString());
      io.of(socketNamespace).to(game._id.toString()).emit("joinedGame", game);
      io.of(socketNamespace).to(userToJoin).emit("joinedGame", game);
    } else {
      socket.emit("error", "That user is not waiting for a game");
    }
  });

  socket.on("disconnecting", (reason) => {
    // Remove user as a waiting user
    for (let room of socket.rooms) {
      if (waitingRandomUsers.has(room)) {
        waitingRandomUsers.delete(room);
      } else if (waitingPrivateUsers.has(room)) {
        waitingPrivateUsers.delete(room);
      }
    }
  });
};
