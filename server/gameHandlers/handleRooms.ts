import { ObjectId } from "mongoose";
import { Game, IGame } from "../../db/models/game";
import { RoomHandlerParameters } from "./types";

interface IWaitingPrivateUser {
  creator: ObjectId;
  opponent: ObjectId;
}

module.exports = ({
  socket,
  io,
  socketNamespace,
  gameTypeId,
  inProgressGames,
}: RoomHandlerParameters) => {
  const waitingRandomUsers: ObjectId[] = [];
  const waitingPrivateUsers: IWaitingPrivateUser[] = [];

  socket.on("joinRandomGame", async (message) => {
    if (waitingRandomUsers.length > 0) {
      let userToJoin = waitingRandomUsers[0];
      let game: IGame = await Game.create({
        type: gameTypeId,
        userIds: [message.userId, userToJoin],
        complete: false,
      });
      inProgressGames.set(game._id.toString(), game);
      waitingRandomUsers.splice(0, 1);
      socket.join(game._id.toString());
      io.of(socketNamespace).to(game._id.toString()).emit("joinedGame", game);
      io.of(socketNamespace).to(userToJoin.toString()).emit("joinedGame", game);
    } else {
      waitingRandomUsers.push(message.userId);
      socket.join(message.userId);
      socket.emit("waiting for opponent", {});
    }
  });

  socket.on("createPrivateGame", (message) => {
    waitingPrivateUsers.push(message.userId);
    socket.join(message.userId);
    socket.emit("waiting for opponent", {});
  });

  socket.on("joinPrivateGame", async (message) => {
    let index = -1;
    waitingPrivateUsers.filter((user: IWaitingPrivateUser, _index: number) => {
      if (user.creator === message.userToJoin && user.opponent === message.userId) {
        index = _index;
      }
    });
    if (index == -1) {
      return socket.emit("error", { error: "that user is not waiting for a game" });
    }
    waitingPrivateUsers.splice(index, 1);

    let game: IGame = await Game.create({
      type: gameTypeId,
      userIds: [message.userId, message.userToJoin],
      complete: false,
    });
    inProgressGames.set(game._id.toString(), game);
    socket.join(game._id.toString());
    io.of(socketNamespace).to(game._id.toString()).emit("joinedGame", game);
    io.of(socketNamespace).to(message.userToJoin.toString()).emit("joinedGame", game);
  });
};
