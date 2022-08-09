import { io, Socket } from "socket.io-client";
import SiteHeader from "../components/SiteHeader";
import { ServerToClientEvents, ClientToServerEvents } from "../../../server/gameHandlers/types";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { IUser } from "../../../db/models/user";
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
        navigate(`/play/${gameType}/${game._id}`);
      });
    }
  }, [user]);

  return (
    <div>
      <SiteHeader isAuthenticated={true} />
      <div className="page"></div>
    </div>
  );
}
