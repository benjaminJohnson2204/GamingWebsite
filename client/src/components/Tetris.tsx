import { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Layer, Rect, Stage } from "react-konva";
import { IUser } from "../../../db/models/user";

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
];

// const pieces = ["i", "o", "t", "j", "l", "s", "z"];

// const piecesToColors = new Map<string, string>([
//   ["i", "cyan"],
//   ["o", "yellow"],
//   ["t", "purple"],
//   ["j", "blue"],
//   ["l", "orange"],
//   ["s", "green"],
//   ["z", "red"],
// ]);

export default function Tetris(props: { user: IUser }) {
  const [begun, setBegun] = useState(false);
  const [ended] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [periodicSet, setPeriodicSet] = useState(false);

  const initialBoxes: string[][] = [];
  for (let i = 0; i < boxesDown; i++) {
    const row = [];
    for (let j = 0; j < boxesAcross; j++) {
      row.push("");
    }
    initialBoxes.push(row);
  }

  const [board, setBoard] = useState<{ boxes: string[][]; activePiece: IActivePiece | undefined }>({
    boxes: initialBoxes,
    activePiece: undefined,
  });

  const initialGameSpeed = 1000; // Time in milliseconds for piece to fall 1 grid square
  const [gameSpeed, setGameSpeed] = useState(initialGameSpeed);

  const boxWidth = window.innerHeight / 25;
  const leftMargin = ((window.innerWidth * 2) / 3 - boxesAcross * boxWidth) / 2;

  useEffect(() => {
    if (begun && !paused && !periodicSet) {
      setTimeout(periodicFall, gameSpeed);
      setPeriodicSet(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [begun, paused]);

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (paused || ended || !begun) return;

      switch (event.key) {
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
        case "Escape":
          clearTimeout();
          setPaused(true);
          break;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [begun]);

  useEffect(() => {
    if (board.activePiece && !pieceCanFall(board)) {
      placePiece();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const generateNewActivePiece = () => {
    setBoard((prevBoard) => ({
      boxes: prevBoard.boxes,
      activePiece: {
        ...pieces[Math.floor(Math.random() * pieces.length)],
        row: 1,
        col: Math.floor(Math.random() * (boxesAcross - 3)),
        clockwiseRotation: Math.floor(Math.random() * 4) / 4,
      },
    }));
  };

  const getSquaresOfPiece = (piece: IActivePiece) => {
    return piece!.squares
      .map((square) => rotationsToTransformations.get(piece!.clockwiseRotation)!(square))
      .map((indices) => [indices[0] + piece!.col, indices[1] + piece!.row]);
  };

  const hardDrop = () => {
    setBoard((prevBoard) => {
      let newBoard = prevBoard!;
      while (pieceCanFall(newBoard)) {
        newBoard.activePiece!.row += 1;
      }
      return {
        boxes: prevBoard.boxes,
        activePiece: {
          ...prevBoard.activePiece!,
          row: newBoard.activePiece!.row,
        },
      };
    });
  };

  const softDrop = () => {
    setBoard((prevBoard) =>
      pieceCanFall(prevBoard)
        ? {
            boxes: prevBoard.boxes,
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
        boxes: prevBoard.boxes,
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
        boxes: prevBoard.boxes,
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
        boxes: prevBoard.boxes,
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
        boxes: prevBoard.boxes,
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
      setTimeout(periodicFall, gameSpeed);
    }
  };

  const pieceCanFall = (board: { boxes: string[][]; activePiece: IActivePiece | undefined }) => {
    return isValidPieceLocation({
      boxes: board.boxes,
      activePiece: { ...board.activePiece!, row: board.activePiece!.row + 1 },
    });
  };

  const isValidPieceLocation = (board: {
    boxes: string[][];
    activePiece: IActivePiece | undefined;
  }) => {
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
            <Stage width={(window.innerWidth * 2) / 3} height={window.innerHeight}>
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
                {board.activePiece &&
                  getSquaresOfPiece(board.activePiece).map((indices) => (
                    <Rect
                      x={indices[0] * boxWidth + leftMargin}
                      y={indices[1] * boxWidth}
                      height={boxWidth}
                      width={boxWidth}
                      stroke="black"
                      fill={board.activePiece!.color}
                    />
                  ))}
              </Layer>
            </Stage>
          </Col>
          <Col xs={12} md={4}>
            {begun ? (
              <>
                <h2 className="m-3">Score: {score}</h2>
                {paused && (
                  <>
                    <h3 className="m-3">Paused</h3>
                    <Button
                      onClick={() => {
                        setPeriodicSet(false);
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
                  setPeriodicSet(false);
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
