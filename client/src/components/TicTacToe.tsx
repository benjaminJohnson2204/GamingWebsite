import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { TicTacToeGame } from "../../../server/gameHandlers/ticTacToe";
import { IUser } from "../../../db/models/user";
import { ClientToServerEvents, ServerToClientEvents } from "../../../server/gameHandlers/types";

export default function TicTacToe(props: {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  user: IUser;
  gameId: string;
}) {
  const [game, setGame] = useState<TicTacToeGame>();

  useEffect(() => {
    props.socket.emit("joinRoom", props.gameId);

    props.socket.on("gameUpdate", (game) => setGame(game as TicTacToeGame));
  }, []);

  return game === undefined ? (
    "Loading..."
  ) : (
    <table>
      <tbody>
        {[0, 1, 2].map((i) => (
          <tr>
            {game.squares.slice(3 * i, 3 * i + 3).map((square, col) => (
              <td
                className="box"
                onClick={() => {
                  if (!game.winner) {
                    props.socket.emit(
                      "move",
                      game._id.toString(),
                      props.user._id.toString(),
                      i,
                      col
                    );
                  }
                }}
              >
                {square}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
