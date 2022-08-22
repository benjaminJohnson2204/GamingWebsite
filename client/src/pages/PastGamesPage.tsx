import { useState, useEffect } from "react";
import SiteHeader from "../components/SiteHeader";
import useAuthenticated from "../components/useAuthenticated";
import { IGame } from "../../../db/models/game";
import { IGameType } from "../../../db/models/gameType";
import mongoose from "mongoose";
import { Container, Table } from "react-bootstrap";

export default function PastGamesPage() {
  const user = useAuthenticated();
  const [games, setGames] = useState<IGame[]>([]);
  const [typeIdsToTypes, setTypeIdsToTypes] = useState<Map<mongoose.Types.ObjectId, IGameType>>();

  useEffect(() => {
    const newTypeIdsToTypes = new Map();
    fetch("/game-type/all", { credentials: "include" })
      .then((res) => res.json())
      .then((data: IGameType[]) => {
        data.forEach((element) => {
          newTypeIdsToTypes.set(element._id, element);
        });
        setTypeIdsToTypes(newTypeIdsToTypes);
      });
    fetch("/game/all", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setGames(data.games));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!games || !typeIdsToTypes) {
    return (
      <div>
        <SiteHeader isAuthenticated={true} />
        <h1>Loading...</h1>
      </div>
    );
  }
  return (
    <div>
      <SiteHeader isAuthenticated={true} />

      <Container fluid className="m-4 justify-content-center">
        <h1>Your games</h1>
        <h2>Multiplayer</h2>
        <Table bordered hover>
          <thead>
            <tr>
              <td>Game</td>
              <td>Opponent</td>
              <td>Winner</td>
            </tr>
          </thead>
          <tbody>
            {games
              .filter((game) => typeIdsToTypes!.get(game.type)!.numPlayers > 1)
              .map((game) => (
                <tr>
                  <td>{typeIdsToTypes!.get(game.type)!.name}</td>
                  <td>{game.usernames.filter((username) => username !== user!.username)}</td>
                  <td>
                    {game.winner
                      ? game.winner._id === user!._id
                        ? user!.username
                        : game.usernames.filter((username) => username !== user!.username)
                      : "tie"}
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>

        <h2>Single player</h2>
        <Table bordered hover>
          <thead>
            <tr>
              <td>Game</td>
              <td>Score</td>
            </tr>
          </thead>
          <tbody>
            {games
              .filter((game) => typeIdsToTypes!.get(game.type)!.numPlayers === 1)
              .map((game) => (
                <tr>
                  <td>{typeIdsToTypes!.get(game.type)!.name}</td>
                  <td>{game.score}</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Container>
    </div>
  );
}
