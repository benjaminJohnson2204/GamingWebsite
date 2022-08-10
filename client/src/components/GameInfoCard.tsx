import { Button, Card } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { IGameType } from "../../../db/models/gameType";
import ChallengeFriend from "./ChallengeFriend";

export default function GameInfoCard(props: { isAuthenticated: boolean; gameType: IGameType }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Card className="m-3">
      <Card.Body>
        <Card.Title
          onClick={() => navigate(`/info/${props.gameType.socketNamespace}`)}
          style={{ cursor: "pointer" }}
        >
          {props.gameType.name}
        </Card.Title>
        <Card.Text>{props.gameType.description}</Card.Text>
        <Card.Text>{`${props.gameType.numPlayers} Players`}</Card.Text>
        {props.isAuthenticated ? (
          props.gameType.numPlayers > 1 ? (
            <>
              <Button
                as="a"
                href={`/waiting-random/${props.gameType.socketNamespace}`}
                style={{ whiteSpace: "normal" }}
              >
                Play a random opponent
              </Button>
              <p />
              <ChallengeFriend gameType={props.gameType.socketNamespace} />
            </>
          ) : (
            <Button as="a" href={`/play/${props.gameType.socketNamespace}`}>
              Play now!
            </Button>
          )
        ) : (
          <Card.Text>
            <Link to={`/login?next=${location.pathname}`}>Login</Link>
            {" or"} <Link to={`/register?next=${location.pathname}`}>sign up</Link> to play!
          </Card.Text>
        )}
      </Card.Body>
    </Card>
  );
}
