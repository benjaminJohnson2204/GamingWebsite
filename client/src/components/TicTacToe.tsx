import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { TicTacToeGame } from "../../../server/gameHandlers/ticTacToe";
import { IUser } from "../../../db/models/user";
import { ClientToServerEvents, ServerToClientEvents } from "../../../server/gameHandlers/types";
import { Col, Container, Row } from "react-bootstrap";

export default function TicTacToe(props: {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  user: IUser;
  gameId: string;
}) {
  const [game, setGame] = useState<TicTacToeGame>();

  useEffect(() => {
    if (props.socket && props.gameId) {
      props.socket.emit("joinRoom", props.gameId);

      props.socket.on("gameUpdate", (_game) => {
        setGame(_game);
      });
    }
  }, [props.socket, props.gameId]);

  return game === undefined || props.user === undefined ? (
    <>
      <h1>Playing Tic-tac-toe</h1>
      <h2>Loading...</h2>
    </>
  ) : (
    <>
      <h1>{game.winner ? "Game Over" : "Playing Tic-tac-toe"}</h1>
      <h2>
        {!game.winner &&
          ((props.user._id === game.xPlayer) === (game.turn === "X")
            ? "Your turn"
            : "Opponent's turn")}
      </h2>
      <Container fluid>
        <Row>
          <Col xs={12} sm={4} md={3}>
            {game.winner === props.user._id && <h2>Winner!</h2>}
            <h1>{props.user.username} (you)</h1>
            <h2>{game.xPlayer === props.user._id ? "X" : "O"}</h2>
          </Col>
          <Col xs={12} sm={8} md={6}>
            {game.complete && !game.winner && <h2>It's a tie!</h2>}
            <Container fluid>
              <table>
                <tbody>
                  {game.squares.map((row, rowIndex) => (
                    <tr>
                      {row.map((square, colIndex) => (
                        <td
                          className="box"
                          onClick={() => {
                            if (!game.complete) {
                              props.socket.emit(
                                "move",
                                game._id.toString(),
                                props.user._id.toString(),
                                rowIndex,
                                colIndex
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
            </Container>
          </Col>
          <Col xs={12} sm={4} md={3}>
            {game.userIds.includes(game.winner) && game.winner !== props.user._id && (
              <h2>Winner!</h2>
            )}
            <h1>
              {game.usernames.filter((username) => username !== props.user.username)[0]} (opponent)
            </h1>
            <h2>{game.xPlayer === props.user._id ? "O" : "X"}</h2>
          </Col>
        </Row>
      </Container>
    </>
  );
}
