import { useEffect, useState } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { IGameType } from "../../../db/models/gameType";
import GameInfoCard from "../components/GameInfoCard";
import SiteHeader from "../components/SiteHeader";

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [gameTypes, setGameTypes] = useState<IGameType[]>();

  useEffect(() => {
    fetch("/auth/user").then((res) => setAuthenticated(res.ok));

    fetch("/game-type/all")
      .then((res) => res.json())
      .then((data) => setGameTypes(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <SiteHeader isAuthenticated={authenticated} />
      <div className="page">
        <h1>Ben's Gaming Website</h1>
        <p>
          Play single-player and multi-player games, challenge your friends, and track your game
          history!
        </p>
        <h2>Gameplay Examples</h2>
        <Row>
          <Col xs={12} lg={6} xl={4}>
            <div className="gameplay-screenshot-container">
              <img
                src="/Screenshots/DotsAndBoxes.png"
                alt="Playing Dots and Boxes"
                width="400"
                height="320"
              />
            </div>
          </Col>
          <Col xs={12} lg={6} xl={4}>
            <div className="gameplay-screenshot-container">
              <img src="/Screenshots/Tetris.png" alt="Playing Tetris" width="400" height="300" />
            </div>
          </Col>
          <Col xs={12} lg={6} xl={4}>
            <div className="gameplay-screenshot-container">
              <img
                src="/Screenshots/Tic-Tac-Toe.png"
                alt="Playing Tic-Tac-Toe"
                width="320"
                height="400"
              />
            </div>
          </Col>
        </Row>
        <Container fluid className="p-4">
          <h2>All Games</h2>
          <Row className="cards-container">
            {gameTypes?.map((gameType) => (
              <Col xs={12} sm={6} md={4}>
                <GameInfoCard isAuthenticated={authenticated} gameType={gameType} />
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </div>
  );
}
