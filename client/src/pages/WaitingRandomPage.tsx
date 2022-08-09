import { io, Socket } from "socket.io-client";
import SiteHeader from "../components/SiteHeader";
import { ServerToClientEvents, ClientToServerEvents } from "../../../server/gameHandlers/types";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { IUser } from "../../../db/models/user";
import useAuthenticated from "../components/useAuthenticated";

export default function WaitingRandomPage() {
  const navigate = useNavigate();
  const { gameType } = useParams();
  const user = useAuthenticated();
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(`/${gameType!}`);

  useEffect(() => {
    console.log(user, gameType);
    if (user) {
      console.log("Emitting");
      socket.emit("joinRandomGame", user._id.toString());
      socket.on("joinedGame", (game) => {
        navigate(`/play/${gameType}/${game._id}`);
      });
    }
  }, [user]);

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
      <div className="page"></div>
      <h1>Waiting for an opponent...</h1>
    </div>
  );
}
