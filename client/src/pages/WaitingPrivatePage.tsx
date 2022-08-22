import { io, Socket } from "socket.io-client";
import SiteHeader from "../components/SiteHeader";
import { ServerToClientEvents, ClientToServerEvents } from "../../../server/gameHandlers/types";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import useAuthenticated from "../components/useAuthenticated";

export default function WaitingPrivatePage() {
  const navigate = useNavigate();
  const { gameType, userToJoin } = useParams();
  const user = useAuthenticated();
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(`/${gameType!}`);

  useEffect(() => {
    if (user) {
      socket.emit("createPrivateGame", user._id.toString(), userToJoin!);

      socket.on("joinedGame", async (game) => {
        navigate(`/play-multi/${gameType}/${game._id}`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
      <div className="page">
        <h1>Waiting for opponent to accept challenge...</h1>
      </div>
    </div>
  );
}
