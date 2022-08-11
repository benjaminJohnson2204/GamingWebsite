import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../../../server/gameHandlers/types";
import DotsAndBoxes from "../components/DotsAndBoxes";
import SiteHeader from "../components/SiteHeader";
import TicTacToe from "../components/TicTacToe";
import useAuthenticated from "../components/useAuthenticated";

export default function PlayGamePage() {
  const user = useAuthenticated();
  const { gameType, gameId } = useParams();
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(`/${gameType!}`);

  const namespacesToComponents = new Map<string, JSX.Element>();
  namespacesToComponents.set(
    "tic-tac-toe",
    <TicTacToe socket={socket} user={user!} gameId={gameId!} />
  );
  namespacesToComponents.set(
    "dots-and-boxes",
    <DotsAndBoxes socket={socket} user={user!} gameId={gameId!} />
  );

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
      <div className="page">{namespacesToComponents.get(gameType!)}</div>
    </div>
  );
}
