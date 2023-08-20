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

  return (
    <div>
      <SiteHeader isAuthenticated={true} />

      <Container fluid className="m-4 justify-content-center">
        <h1 className="text-center">Your games</h1>
        <h2 className="my-2">Multiplayer</h2>
        <Table bordered hover>
          <thead>
            <tr>
              <td>Game</td>
              <td>Opponent</td>
              <td>Winner</td>
            </tr>
          </thead>
          <tbody>
            {typeIdsToTypes
              ? games
                  ?.filter((game) => typeIdsToTypes!.get(game.type)!.numPlayers > 1)
                  .map((game) => (
                    <tr>
                      <td>{typeIdsToTypes!.get(game.type)!.name}</td>
                      <td>{game.usernames.filter((username) => username !== user?.username)}</td>
                      <td>
                        {game.winner
                          ? game.winner === user!._id
                            ? user!.username
                            : game.usernames.filter((username) => username !== user?.username)
                          : "tie"}
                      </td>
                    </tr>
                  ))
              : null}
          </tbody>
        </Table>
        {!games || !typeIdsToTypes ? <h4>Loading...</h4> : null}
        {games &&
        typeIdsToTypes &&
        games.filter((game) => typeIdsToTypes!.get(game.type)!.numPlayers === 1).length === 0 ? (
          <h4>No multiplayer games yet!</h4>
        ) : null}

        <h2 className="mt-3 mb-2">Single player</h2>
        <Table bordered hover>
          <thead>
            <tr>
              <td>Game</td>
              <td>Score</td>
            </tr>
          </thead>
          <tbody>
            {typeIdsToTypes
              ? games
                  ?.filter((game) => typeIdsToTypes!.get(game.type)!.numPlayers === 1)
                  .map((game) => (
                    <tr>
                      <td>{typeIdsToTypes!.get(game.type)!.name}</td>
                      <td>{game.score}</td>
                    </tr>
                  ))
              : null}
          </tbody>
        </Table>
        {!games || !typeIdsToTypes ? <h4>Loading...</h4> : null}
        {games &&
        typeIdsToTypes &&
        games.filter((game) => typeIdsToTypes!.get(game.type)!.numPlayers === 1).length === 0 ? (
          <h4>No single player games yet!</h4>
        ) : null}
      </Container>
    </div>
  );
}
