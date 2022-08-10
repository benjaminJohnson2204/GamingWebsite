import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "../../../server/gameHandlers/types";
import SiteHeader from "../components/SiteHeader";
import TicTacToe from "../components/TicTacToe";
import useAuthenticated from "../components/useAuthenticated";

export default function PlayGamePage() {
  const user = useAuthenticated();
  const { gameType, gameId } = useParams();
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(`/${gameType!}`);

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
      <div className="page">
        <TicTacToe socket={socket} user={user!} gameId={gameId!} />
      </div>
    </div>
  );
}
