import { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { Link, useLocation, useParams } from "react-router-dom";
import { IGameType } from "../../../db/models/gameType";
import ChallengeFriend from "../components/ChallengeFriend";
import SiteHeader from "../components/SiteHeader";
import NotFoundPage from "./NotFoundPage";

export default function GameInfoPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [gameInfo, setGameInfo] = useState<IGameType>();
  const [notFound, setNotFound] = useState(false);

  const location = useLocation();
  const { gameType } = useParams();

  useEffect(() => {
    fetch("/auth/user").then((res: Response) => {
      setAuthenticated(res.ok);
    });

    fetch(`/game-type/${gameType}`).then((res) => {
      if (res.ok) {
        res.json().then((data) => setGameInfo(data));
      } else {
        setNotFound(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (notFound) {
    return <NotFoundPage />;
  }

  if (gameInfo === undefined) {
    return (
      <div>
        <SiteHeader isAuthenticated={authenticated} />
        <div className="page">
          <h1>Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader isAuthenticated={authenticated} />
      <div className="page">
        <h1 className="m-3">{gameInfo.name}</h1>
        <h2>{gameInfo.description}</h2>
        <h4>{`${gameInfo.numPlayers} Players`}</h4>

        {authenticated ? (
          gameInfo.numPlayers > 1 ? (
            <Container fluid className="m-3">
              <Row>
                <Col xs={12}>
                  <Button as="a" href={`/waiting-random/${gameType}`}>
                    Play a random opponent
                  </Button>
                </Col>
              </Row>
              <Row>
                <Col xs={12}>
                  <ChallengeFriend gameType={gameType!} />
                </Col>
              </Row>
            </Container>
          ) : (
            <Container fluid>
              <Row>
                <Col xs={12}>
                  <Button as="a" href={`/play-single/${gameType}`}>
                    Play now!
                  </Button>
                </Col>
              </Row>
            </Container>
          )
        ) : (
          <div>
            <Link to={`/login?next=${location.pathname}`}>Login</Link>
            {" or"} <Link to={`/register?next=${location.pathname}`}>sign up</Link> to play!
          </div>
        )}
      </div>
    </div>
  );
}
