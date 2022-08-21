import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { DotsAndBoxesGame } from "../../../server/gameHandlers/dotsAndBoxes";
import { IUser } from "../../../db/models/user";
import { ClientToServerEvents, ServerToClientEvents } from "../../../server/gameHandlers/types";
import { Col, Container, Form, Row } from "react-bootstrap";
import { Circle, Rect, Layer, Stage, Shape } from "react-konva";

interface IDimensions {
  boxWidth: number;
  boxHeight: number;
  dotRadius: number;
  lineThickness: number;
}

export default function DotsAndBoxes(props: {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  user: IUser;
  gameId: string;
}) {
  const [game, setGame] = useState<DotsAndBoxesGame>();
  const [stageWidth, setStageWidth] = useState(0);
  const [lengths, setLengths] = useState<IDimensions>();
  const [selectedDotIndicies, setSelectedDotIndices] = useState({ row: -1, col: -1 });
  const [mousePosition, setMousePosition] = useState({ x: -1, y: -1 });
  const [mouseOffset, setMouseOffset] = useState({ x: -1, y: -1 });
  const [container, setContainer] = useState<HTMLElement>();
  const [availableColors, setAvailableColors] = useState<string[]>();

  useEffect(() => {
    window.onresize = resizeGame;

    fetch("/game/dots-and-boxes/colors", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAvailableColors(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (props.socket && props.gameId) {
      props.socket.emit("joinRoom", props.gameId);

      props.socket.on("gameUpdate", (_game) => {
        setGame(_game);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.socket, props.gameId]);

  useEffect(() => {
    resizeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const resizeGame = () => {
    if (game) {
      const boxWidth = ((container?.offsetWidth || 0) * 0.9) / game.boxes[0].length;
      setLengths({
        boxWidth: boxWidth,
        boxHeight: boxWidth,
        dotRadius: boxWidth / 8,
        lineThickness: boxWidth / 8,
      });
      setStageWidth(container?.offsetWidth || 0);
    }
  };

  const renderDots = (_game: DotsAndBoxesGame, _lengths: IDimensions) => {
    const dots = [];
    for (let i = 0; i <= _game.boxes.length; i++) {
      const row = [];
      for (let j = 0; j <= _game.boxes[0].length; j++) {
        row.push(
          <Circle
            x={_lengths.dotRadius + j * _lengths.boxWidth}
            y={_lengths.dotRadius + i * _lengths.boxHeight}
            radius={_lengths.dotRadius}
            fill="black"
            onMouseDown={(event) => {
              setSelectedDotIndices({ row: i, col: j });
              setMouseOffset({
                x: event.evt.clientX - (_lengths.dotRadius + j * _lengths.boxWidth),
                y: event.evt.clientY - (_lengths.dotRadius + i * _lengths.boxHeight),
              });
            }}
            onMouseUp={() => {
              if (
                game &&
                !game.complete &&
                game.turn === props.user._id &&
                selectedDotIndicies["row"] !== -1 &&
                selectedDotIndicies["col"] !== -1
              ) {
                if (i === selectedDotIndicies["row"] && j === selectedDotIndicies["col"] + 1) {
                  props.socket.emit(
                    "move",
                    game._id.toString(),
                    props.user._id.toString(),
                    i,
                    j - 1,
                    true
                  );
                } else if (
                  i === selectedDotIndicies["row"] &&
                  j === selectedDotIndicies["col"] - 1
                ) {
                  props.socket.emit(
                    "move",
                    game._id.toString(),
                    props.user._id.toString(),
                    i,
                    j,
                    true
                  );
                } else if (
                  i === selectedDotIndicies["row"] + 1 &&
                  j === selectedDotIndicies["col"]
                ) {
                  props.socket.emit(
                    "move",
                    game._id.toString(),
                    props.user._id.toString(),
                    i - 1,
                    j,
                    false
                  );
                } else if (
                  i === selectedDotIndicies["row"] - 1 &&
                  j === selectedDotIndicies["col"]
                ) {
                  props.socket.emit(
                    "move",
                    game._id.toString(),
                    props.user._id.toString(),
                    i,
                    j,
                    false
                  );
                }
                setSelectedDotIndices({ row: -1, col: -1 });
              }
            }}
          />
        );
        dots.push(row);
      }
    }
    return dots;
  };

  return game === undefined || lengths === undefined || props.user === undefined ? (
    <>
      <h1>Playing Dots and Boxes</h1>
      <h2>Loading...</h2>
    </>
  ) : (
    <div onMouseUp={() => setSelectedDotIndices({ row: -1, col: -1 })}>
      <h1>{game.complete ? "Game Over" : "Playing Dots and Boxes"}</h1>
      <h2>{!game.complete && (props.user._id === game.turn ? "Your turn" : "Opponent's turn")}</h2>
      <Container fluid>
        <Row>
          <Col xs={12} sm={4} md={3}>
            {game.winner === props.user._id && <h2>Winner!</h2>}
            <h1>{props.user.username} (you)</h1>
            <Form>
              <Form.Group>
                <Form.Label>Choose your color</Form.Label>
                <Form.Select
                  onChange={(event) =>
                    props.socket.emit(
                      "chooseColor",
                      props.gameId,
                      props.user._id.toString(),
                      event.target.value
                    )
                  }
                  defaultValue={game.colors[props.user._id === game.userIds[0] ? 0 : 1]}
                >
                  {availableColors?.map((color) => (
                    <option
                      style={{
                        backgroundColor: color,
                      }}
                    >
                      {color}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Col>
          <Col
            xs={12}
            sm={8}
            md={6}
            id="game-container"
            ref={(node: HTMLElement) => setContainer(node)}
          >
            {game.complete && !game.winner && <h2>It's a tie!</h2>}
            <Container
              fluid
              onMouseMove={(event) => setMousePosition({ x: event.clientX, y: event.clientY })}
            >
              <Stage width={stageWidth} height={window.innerHeight}>
                <Layer>
                  {game.boxes.map((row, rowIndex) =>
                    row.map(
                      (box, colIndex) =>
                        box && (
                          <Rect
                            x={lengths.dotRadius + colIndex * lengths.boxWidth}
                            y={lengths.dotRadius + rowIndex * lengths.boxHeight}
                            height={lengths.boxHeight}
                            width={lengths.boxWidth}
                            fill={game.colors[box === game.userIds[0] ? 0 : 1]}
                          />
                        )
                    )
                  )}

                  {game.horizontalLines.map((row, rowIndex) =>
                    row.map(
                      (line, colIndex) =>
                        line && (
                          <Rect
                            x={lengths.dotRadius + colIndex * lengths.boxWidth}
                            y={
                              lengths.dotRadius -
                              lengths.lineThickness / 2 +
                              rowIndex * lengths.boxHeight
                            }
                            width={lengths.boxWidth}
                            height={lengths.lineThickness}
                            fill="brown"
                          />
                        )
                    )
                  )}

                  {game.verticalLines.map((row, rowIndex) => (
                    <>
                      {row.map((line, colIndex) => (
                        <>
                          {line && (
                            <Rect
                              x={
                                lengths.dotRadius -
                                lengths.lineThickness / 2 +
                                colIndex * lengths.boxWidth
                              }
                              y={lengths.dotRadius + rowIndex * lengths.boxHeight}
                              width={lengths.lineThickness}
                              height={lengths.boxHeight}
                              fill="brown"
                            />
                          )}
                        </>
                      ))}
                    </>
                  ))}

                  {renderDots(game, lengths)}

                  <Shape
                    sceneFunc={(context, shape) => {
                      if (
                        mousePosition.x === -1 ||
                        mousePosition.y === -1 ||
                        selectedDotIndicies["col"] === -1 ||
                        selectedDotIndicies["row"] === -1
                      ) {
                        return;
                      }
                      context.beginPath();
                      context.moveTo(
                        lengths.dotRadius + selectedDotIndicies["col"] * lengths.boxWidth,
                        lengths.dotRadius + selectedDotIndicies["row"] * lengths.boxHeight
                      );
                      context.lineTo(
                        mousePosition.x - mouseOffset.x,
                        mousePosition.y - mouseOffset.y
                      );
                      context.closePath();
                      context.fillStrokeShape(shape);
                    }}
                    stroke="brown"
                    strokeWidth={lengths.lineThickness}
                  />
                </Layer>
              </Stage>
            </Container>
          </Col>
          <Col xs={12} sm={4} md={3}>
            {game.userIds.includes(game.winner) && game.winner !== props.user._id && (
              <h2>Winner!</h2>
            )}
            <h1>
              {game.usernames.filter((username) => username !== props.user.username)[0]} (opponent)
            </h1>
            <Form>
              <Form.Group>
                <Form.Label>Opponent's color</Form.Label>
                <Form.Select>
                  <option
                    selected
                    style={{
                      backgroundColor: game.colors[props.user._id === game.userIds[0] ? 1 : 0],
                    }}
                  >
                    {game.colors[props.user._id === game.userIds[0] ? 1 : 0]}
                  </option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
