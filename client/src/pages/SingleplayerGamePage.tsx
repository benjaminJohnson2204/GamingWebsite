import { useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Tetris from "../components/Tetris";
import useAuthenticated from "../components/useAuthenticated";

export default function SingleplayerGamePage() {
  useAuthenticated();
  const { gameType } = useParams();

  const saveGameFunction = (score: number) => {
    return fetch("/game/add", {
      credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gameType: gameType,
        score: score,
      }),
    });
  };

  const getHighScore = (gameTypeNamespace: string) => {
    return fetch(`/game-type/${gameTypeNamespace}`)
      .then((res) => res.json())
      .then((gameType) =>
        fetch(`/game/high-score/${gameType._id}`, {
          credentials: "include",
        }).then((res) => res.json())
      );
  };

  const gameTypesToComponents = new Map<string, JSX.Element>();
  gameTypesToComponents.set(
    "tetris",
    <Tetris saveGameFunction={saveGameFunction} getHighScore={() => getHighScore("tetris")} />
  );

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
      <div className="page">{gameTypesToComponents.get(gameType!)}</div>
    </div>
  );
}
