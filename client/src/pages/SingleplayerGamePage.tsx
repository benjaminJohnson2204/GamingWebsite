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

  const gameTypesToComponents = new Map<string, JSX.Element>();
  gameTypesToComponents.set("tetris", <Tetris saveGameFunction={saveGameFunction} />);

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
      <div className="page">{gameTypesToComponents.get(gameType!)}</div>
    </div>
  );
}
