import { useParams } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Tetris from "../components/Tetris";
import useAuthenticated from "../components/useAuthenticated";

export default function SingleplayerGamePage() {
  const user = useAuthenticated();
  const { gameType } = useParams();

  const gameTypesToComponents = new Map<string, JSX.Element>();
  gameTypesToComponents.set("tetris", <Tetris user={user!} />);

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
      <div className="page">{gameTypesToComponents.get(gameType!)}</div>
    </div>
  );
}
