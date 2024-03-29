import { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Layer, Rect, Stage } from "react-konva";

interface IPiece {
  letter: string;
  color: string;
  squares: number[][];
}

interface IActivePiece extends IPiece {
  // Row and col of center of piece
  row: number;
  col: number;
  clockwiseRotation: number;
}

interface IBoard {
  boxes: string[][];
  activePiece: IActivePiece | undefined;
  nextPiece: IPiece | undefined;
}

const boxesDown = 20;
const boxesAcross = 10;

const rowsToPoints = new Map<number, number>([
  [1, 1],
  [2, 3],
  [3, 5],
  [4, 8],
]);

const rotationsToTransformations = new Map<number, (coordinates: number[]) => number[]>([
  [0, (coordinates) => coordinates],
  [0.25, (coordinates) => [coordinates[1], -coordinates[0]]],
  [0.5, (coordinates) => [-coordinates[0], -coordinates[1]]],
  [0.75, (coordinates) => [-coordinates[1], coordinates[0]]],
]);

const pieces: IPiece[] = [
  {
    letter: "i",
    color: "cyan",
    squares: [
      [0, -1],
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  },
  {
    letter: "o",
    color: "yellow",
    squares: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  },
  {
    letter: "t",
    color: "purple",
    squares: [
      [0, 0],
      [0, -1],
      [-1, 0],
      [1, 0],
    ],
  },
  {
    letter: "j",
    color: "blue",
    squares: [
      [0, 0],
      [0, -1],
      [0, 1],
      [-1, 1],
    ],
  },
  {
    letter: "l",
    color: "orange",
    squares: [
      [0, 0],
      [0, -1],
      [0, 1],
      [1, 1],
    ],
  },
  {
    letter: "s",
    color: "green",
    squares: [
      [0, 0],
      [0, -1],
      [-1, 0],
      [1, -1],
    ],
  },
  {
    letter: "z",
    color: "red",
    squares: [
      [0, 0],
      [0, -1],
      [1, 0],
      [-1, -1],
    ],
  },
];

export default function Tetris(props: {
  saveGameFunction: (score: number) => void;
  getHighScore: () => Promise<number>;
}) {
  const [begun, setBegun] = useState(false);
  const [ended, setEnded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [keypressEvent, setKeypressEvent] = useState<KeyboardEvent>();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

  const initialBoxes: string[][] = [];
  for (let i = 0; i < boxesDown; i++) {
    const row = [];
    for (let j = 0; j < boxesAcross; j++) {
      row.push("");
    }
    initialBoxes.push(row);
  }

  const [board, setBoard] = useState<IBoard>({
    boxes: initialBoxes,
    nextPiece: undefined,
    activePiece: undefined,
  });

  const initialGameSpeed = 1000; // Time in milliseconds for piece to fall 1 grid square
  const [gameSpeed, setGameSpeed] = useState(initialGameSpeed);

  const boxWidth = (window.innerHeight - 100) / 25;
  const leftMargin = ((window.innerWidth * 2) / 3 - boxesAcross * boxWidth) / 2;

  useEffect(() => {
    if (paused) {
      clearTimeout(timeoutId);
      setTimeoutId(undefined);
    }
    if (begun && !paused && !timeoutId) {
      setTimeoutId(setTimeout(periodicFall, gameSpeed));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [begun, paused]);

  useEffect(() => {
    if (board.activePiece && !pieceCanFall(board)) {
      if (board.activePiece.row === 2) {
        // End game when a just-spawned piece is on top of another piece
        setEnded(true);
        props.saveGameFunction(score);
      } else {
        placePiece();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  useEffect(() => {
    props.getHighScore().then((score) => setHighScore(score));
    document.addEventListener("keydown", setKeypressEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!keypressEvent || ended || !begun) return;
    if (keypressEvent.key === "Escape") setPaused((prevPaused) => !prevPaused);
    if (paused) return;
    switch (keypressEvent.key) {
      case "ArrowLeft":
        shiftLeft();
        break;
      case "ArrowRight":
        shiftRight();
        break;
      case "ArrowUp":
        rotateClockwise();
        break;
      case "ArrowDown":
        softDrop();
        break;
      case " ":
        hardDrop();
        break;
      case "z":
        rotateCounterClockwise();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keypressEvent]);

  const generateNewActivePiece = () => {
    setBoard((prevBoard) => ({
      boxes: prevBoard.boxes,
      activePiece: {
        ...(prevBoard.nextPiece || pieces[Math.floor(Math.random() * pieces.length)]),
        row: 2,
        col: Math.floor(Math.random() * (boxesAcross - 4)) + 2,
        clockwiseRotation: Math.floor(Math.random() * 4) / 4,
      },
      nextPiece: pieces[Math.floor(Math.random() * pieces.length)],
    }));
  };

  const getSquaresOfPiece = (piece: IActivePiece) => {
    return piece!.squares
      .map((square) => rotationsToTransformations.get(piece!.clockwiseRotation)!(square))
      .map((indices) => [indices[0] + piece!.col, indices[1] + piece!.row]);
  };

  const rowsCanFall = (board: IBoard) => {
    let result = 0;
    let originalRow = board.activePiece!.row;
    while (pieceCanFall(board)) {
      board.activePiece!.row += 1;
      result += 1;
    }
    board.activePiece!.row = originalRow;
    return result;
  };

  const hardDrop = () => {
    setBoard((prevBoard) => ({
      ...prevBoard,
      activePiece: {
        ...prevBoard.activePiece!,
        row: prevBoard.activePiece!.row + rowsCanFall(prevBoard),
      },
    }));
  };

  const softDrop = () => {
    setBoard((prevBoard) =>
      pieceCanFall(prevBoard)
        ? {
            ...prevBoard,
            activePiece: {
              ...prevBoard.activePiece!,
              row: prevBoard.activePiece!.row + 1,
            },
          }
        : prevBoard
    );
  };

  const shiftLeft = () => {
    setBoard((prevBoard) => {
      const tryShiftingBoard = {
        ...prevBoard,
        activePiece: {
          ...prevBoard.activePiece!,
          col: prevBoard.activePiece!.col - 1,
        },
      };
      if (isValidPieceLocation(tryShiftingBoard)) {
        return tryShiftingBoard;
      }
      return prevBoard;
    });
  };

  const shiftRight = () => {
    setBoard((prevBoard) => {
      const tryShiftingBoard = {
        ...prevBoard,
        activePiece: {
          ...prevBoard.activePiece!,
          col: prevBoard.activePiece!.col + 1,
        },
      };
      if (isValidPieceLocation(tryShiftingBoard)) {
        return tryShiftingBoard;
      }
      return prevBoard;
    });
  };

  const rotateClockwise = () => {
    setBoard((prevBoard) => {
      const tryRotatingBoard = {
        ...prevBoard,
        activePiece: {
          ...prevBoard.activePiece!,
          clockwiseRotation: (prevBoard.activePiece!.clockwiseRotation + 0.25) % 1,
        },
      };
      if (isValidPieceLocation(tryRotatingBoard)) {
        return tryRotatingBoard;
      }
      return prevBoard;
    });
  };

  const rotateCounterClockwise = () => {
    setBoard((prevBoard) => {
      const tryRotatingBoard = {
        ...prevBoard,
        activePiece: {
          ...prevBoard.activePiece!,
          clockwiseRotation: (prevBoard.activePiece!.clockwiseRotation + 0.75) % 1,
        },
      };
      if (isValidPieceLocation(tryRotatingBoard)) {
        return tryRotatingBoard;
      }
      return prevBoard;
    });
  };

  const periodicFall = () => {
    if (!paused && !ended) {
      if (board.activePiece) {
        softDrop();
      }
      setTimeoutId(setTimeout(periodicFall, gameSpeed));
    }
  };

  const pieceCanFall = (board: IBoard) => {
    return isValidPieceLocation({
      ...board,
      activePiece: { ...board.activePiece!, row: board.activePiece!.row + 1 },
    });
  };

  const isValidPieceLocation = (board: IBoard) => {
    for (var [col, row] of getSquaresOfPiece(board.activePiece!)) {
      if (col < 0 || col >= boxesAcross || row < 0 || row >= boxesDown || board.boxes[row][col]) {
        return false;
      }
    }
    return true;
  };

  const placePiece = () => {
    setBoard((prevBoard) => {
      const newBoard = prevBoard;
      for (var [col, row] of getSquaresOfPiece(prevBoard.activePiece!)) {
        newBoard.boxes[row][col] = prevBoard.activePiece!.letter;
      }
      return newBoard;
    });
    generateNewActivePiece();
    checkForCompleteRows();
  };

  const checkForCompleteRows = () => {
    setBoard((prevBoard) => {
      const newBoard = prevBoard;
      const completeRowIndices = [];
      for (let rowIndex = 0; rowIndex < boxesDown; rowIndex++) {
        let rowFull = true;
        for (const square of prevBoard.boxes[rowIndex]) {
          if (!square) {
            rowFull = false;
            break;
          }
        }
        if (rowFull) {
          completeRowIndices.push(rowIndex);
        }
      }
      for (const completeRowIndex of completeRowIndices) {
        newBoard.boxes = [initialBoxes[0].map((element) => "")]
          .concat(newBoard.boxes.slice(0, completeRowIndex))
          .concat(newBoard.boxes.slice(completeRowIndex + 1));
      }
      if (completeRowIndices.length > 0) {
        setScore((prevScore) => prevScore + rowsToPoints.get(completeRowIndices.length)!);
        updateGameSpeed();
      }
      return newBoard;
    });
  };

  const updateGameSpeed = () => {
    const newGameSpeed = initialGameSpeed / (Math.floor(score / 10) + 1);
    if (newGameSpeed !== gameSpeed) {
      setGameSpeed(newGameSpeed);
    }
  };

  return (
    <div>
      <h1 className="m-3">{ended ? "Game Over" : "Tetris"}</h1>
      <Container fluid>
        <Row>
          <Col xs={12} md={8}>
            <Stage width={(window.innerWidth * 2) / 3} height={window.innerHeight - 100}>
              <Layer>
                {board.boxes.map((row, rowIndex) =>
                  row.map((square, colIndex) => (
                    <Rect
                      key={rowIndex * boxesAcross + colIndex}
                      x={colIndex * boxWidth + leftMargin}
                      y={rowIndex * boxWidth}
                      height={boxWidth}
                      width={boxWidth}
                      stroke="black"
                      fill={
                        square
                          ? pieces.filter((piece) => piece.letter === square)[0].color
                          : "white"
                      }
                    />
                  ))
                )}
                {board.activePiece && (
                  <>
                    {getSquaresOfPiece(board.activePiece).map((indices) => (
                      <Rect
                        key={indices[1] * boxesAcross + indices[0]}
                        x={indices[0] * boxWidth + leftMargin}
                        y={indices[1] * boxWidth}
                        height={boxWidth}
                        width={boxWidth}
                        stroke="black"
                        fill={board.activePiece!.color}
                      />
                    ))}
                    {getSquaresOfPiece({
                      ...board.activePiece!,
                      row: board.activePiece!.row + rowsCanFall(board),
                    }).map((square, index) => (
                      <Rect
                        key={index}
                        x={square[0] * boxWidth + leftMargin}
                        y={square[1] * boxWidth}
                        height={boxWidth}
                        width={boxWidth}
                        stroke="black"
                        opacity={0.5}
                        fill={board.activePiece!.color}
                      />
                    ))}
                  </>
                )}
              </Layer>
            </Stage>
          </Col>
          <Col xs={12} md={4}>
            {begun ? (
              <>
                <h2>Next</h2>
                <Stage height={window.innerHeight / 4} width={window.innerWidth / 6}>
                  <Layer>
                    <Rect
                      x={window.innerWidth / 12}
                      y={0}
                      height={window.innerHeight / 4}
                      width={window.innerWidth / 12}
                      stroke="black"
                    />
                    {board.nextPiece &&
                      board.nextPiece.squares.map((square, index) => (
                        <Rect
                          key={index}
                          x={window.innerWidth / 12 + (square[0] + 2) * boxWidth}
                          y={(square[1] + 2) * boxWidth}
                          height={boxWidth}
                          width={boxWidth}
                          stroke="black"
                          fill={board.nextPiece!.color}
                        />
                      ))}
                  </Layer>
                </Stage>
                <h2 className="m-3">Score: {score}</h2>
                <h3 className="m-3">High score: {highScore}</h3>
                {paused && (
                  <>
                    <h3 className="m-3">Paused</h3>
                    <Button
                      onClick={() => {
                        setPaused(false);
                      }}
                    >
                      Resume
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button
                onClick={() => {
                  setBegun(true);
                  generateNewActivePiece();
                }}
              >
                Start!
              </Button>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
