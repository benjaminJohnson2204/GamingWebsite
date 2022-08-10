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
  }, []);

  return (
    <div>
      <SiteHeader isAuthenticated={authenticated} />
      <div className="page">
        {gameTypes && (
          <Container fluid>
            <Row>
              {gameTypes.map((gameType) => (
                <Col xs={12} sm={6} md={4} lg={3} xl={2}>
                  <GameInfoCard isAuthenticated={authenticated} gameType={gameType} />
                </Col>
              ))}
            </Row>
          </Container>
        )}
      </div>
    </div>
  );
}
