import { ObjectId } from "mongoose";
import { Game, IGame } from "../../db/models/game";
import { RoomHandlerParameters } from "./types";

module.exports = ({
  socket,
  io,
  socketNamespace,
  gameTypeId,
  inProgressGames,
}: RoomHandlerParameters) => {
  const waitingRandomUsers = new Set<string>();
  const waitingPrivateUsers = new Map<string, string>(); // Keys are creators, values are opponents

  socket.on("joinRandomGame", async (userId) => {
    if (waitingRandomUsers.size > 0) {
      // Get first user (one who has been waiting the longest)
      let [userToJoin] = waitingRandomUsers.values();
      let game: IGame = await Game.create({
        type: gameTypeId,
        userIds: [userId, userToJoin],
        complete: false,
      });
      inProgressGames.set(game._id.toString(), game);
      waitingRandomUsers.delete(userToJoin);
      socket.join(game._id.toString());
      io.of(socketNamespace).to(game._id.toString()).emit("joinedGame", game);
      io.of(socketNamespace).to(userToJoin).emit("joinedGame", game);
    } else {
      waitingRandomUsers.add(userId);
      socket.join(userId);
      socket.emit("waiting for opponent", {});
    }
  });

  socket.on("createPrivateGame", (userId, opponentId) => {
    waitingPrivateUsers.set(userId, opponentId);
    socket.join(userId);
    socket.emit("waiting for opponent", {});
  });

  socket.on("joinPrivateGame", async (userId, userToJoin) => {
    if (waitingPrivateUsers.has(userToJoin)) {
      waitingPrivateUsers.delete(userToJoin);

      let game: IGame = await Game.create({
        type: gameTypeId,
        userIds: [userId, userToJoin],
        complete: false,
      });
      inProgressGames.set(game._id.toString(), game);
      socket.join(game._id.toString());
      io.of(socketNamespace).to(game._id.toString()).emit("joinedGame", game);
      io.of(socketNamespace).to(userToJoin).emit("joinedGame", game);
    } else {
      socket.emit("error", { error: "that user is not waiting for a game" });
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
