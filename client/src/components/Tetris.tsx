import { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Layer, Rect, Stage } from "react-konva";
import { IUser } from "../../../db/models/user";

interface IPiece {
  letter: string;
  color: string;
  rotationToSquares: Map<number, number[][]>;
}

interface IActivePiece extends IPiece {
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

const pieces: IPiece[] = [
  {
    letter: "i",
    color: "cyan",
    rotationToSquares: new Map([
      [
        0,
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
        ],
      ],
      [
        0.25,
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
        ],
      ],
      [
        0.5,
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
        ],
      ],
      [
        0.75,
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
        ],
      ],
    ]),
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
  const [boxes, setBoxes] = useState(initialBoxes);
  const [activePiece, setActivePiece] = useState<IActivePiece>();

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
    if (activePiece && !pieceCanFall(activePiece)) {
      placePiece(activePiece);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePiece]);

  const generateNewActivePiece = () => {
    setActivePiece({
      ...pieces[Math.floor(Math.random() * pieces.length)],
      row: 0,
      col: Math.floor(Math.random() * (boxesAcross - 3)),
      clockwiseRotation: Math.floor(Math.random() * 4) / 4,
    });
  };

  const getSquaresOfPiece = (piece: IActivePiece) => {
    return piece!.rotationToSquares
      .get(piece!.clockwiseRotation)!
      .map((indices) => [indices[0] + piece!.col, indices[1] + piece!.row]);
  };

  const hardDrop = () => {
    setActivePiece((prevActivePiece) => {
      let newActivePiece = prevActivePiece!;
      while (pieceCanFall(newActivePiece!)) {
        newActivePiece!.row += 1;
      }
      return { ...prevActivePiece!, row: newActivePiece!.row };
    });
  };

  const softDrop = () => {
    setActivePiece((prevActivePiece) =>
      pieceCanFall(prevActivePiece!)
        ? { ...prevActivePiece!, row: prevActivePiece!.row + 1 }
        : prevActivePiece
    );
  };

  const shiftLeft = () => {
    setActivePiece((prevActivePiece) => {
      for (const [col, row] of getSquaresOfPiece(prevActivePiece!)) {
        if (col === 0 || boxes[row][col - 1]) {
          return prevActivePiece;
        }
      }
      return { ...prevActivePiece!, col: prevActivePiece!.col - 1 };
    });
  };

  const shiftRight = () => {
    setActivePiece((prevActivePiece) => {
      for (const [col, row] of getSquaresOfPiece(prevActivePiece!)) {
        if (col === boxesAcross - 1 || boxes[row][col + 1]) {
          return prevActivePiece;
        }
      }
      return { ...prevActivePiece!, col: prevActivePiece!.col + 1 };
    });
  };

  const rotateClockwise = () => {
    setActivePiece((prevActivePiece) => ({
      ...prevActivePiece!,
      clockwiseRotation: (prevActivePiece!.clockwiseRotation + 0.25) % 1,
    }));
  };

  const rotateCounterClockwise = () => {
    setActivePiece((prevActivePiece) => ({
      ...activePiece!,
      clockwiseRotation: (prevActivePiece!.clockwiseRotation + 0.75) % 1,
    }));
  };

  const periodicFall = () => {
    if (!paused && !ended) {
      if (activePiece) {
        softDrop();
      }
      setTimeout(periodicFall, gameSpeed);
    }
  };

  const pieceCanFall = (piece: IActivePiece) => {
    for (var [col, row] of getSquaresOfPiece(piece)) {
      if (row === boxesDown - 1 || boxes[row + 1][col]) {
        return false;
      }
    }
    return true;
  };

  const placePiece = (piece: IActivePiece) => {
    const newBoxes = boxes;
    for (var [col, row] of getSquaresOfPiece(piece)) {
      newBoxes[row][col] = activePiece!.letter;
    }
    setBoxes(newBoxes);
    generateNewActivePiece();
    checkForCompleteRows(newBoxes);
  };

  const checkForCompleteRows = (_boxes: string[][]) => {
    const completeRowIndices = [];
    for (let rowIndex = 0; rowIndex < boxesDown; rowIndex++) {
      let rowFull = true;
      for (const square of _boxes[rowIndex]) {
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
      _boxes = [initialBoxes[0].map((element) => "")]
        .concat(_boxes.slice(0, completeRowIndex))
        .concat(_boxes.slice(completeRowIndex + 1));
    }
    setBoxes((prevBoxes) => _boxes);
    if (completeRowIndices.length > 0) {
      setScore((prevScore) => prevScore + rowsToPoints.get(completeRowIndices.length)!);
      updateGameSpeed();
    }
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
                {boxes.map((row, rowIndex) =>
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
                {activePiece &&
                  getSquaresOfPiece(activePiece).map((indices) => (
                    <Rect
                      x={indices[0] * boxWidth + leftMargin}
                      y={indices[1] * boxWidth}
                      height={boxWidth}
                      width={boxWidth}
                      stroke="black"
                      fill={activePiece!.color}
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
