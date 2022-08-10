import chai from "chai";
import chaiHttp from "chai-http";
import app from "../server/index";
import dotenv from "dotenv";
import mongoUnit from "mongo-unit";
import { GameType } from "../db/models/gameType";

const assert = chai.assert;
chai.use(chaiHttp);

dotenv.config({ path: ".env" });

let agent: ChaiHttp.Agent;

describe("Game Tests", () => {
  before(async () => {
    agent = chai.request.agent(app);
    await GameType.create({
      name: "Tic-Tac-Toe",
      socketNamespace: "tic-tac-toe",
      description: "First player to claim three boxes in a row wins!",
      numPlayers: 2,
    });
  });

  after(async () => {
    await mongoUnit.drop();
    agent.close();
  });

  it("Get all game types", (done) => {
    agent.get("/game-type/all").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).length, 1);
      assert.equal(JSON.parse(res.text)[0].name, "Tic-Tac-Toe");
      done();
    });
  });

  it("Get specific game type", (done) => {
    agent.get("/game-type/tic-tac-toe").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).name, "Tic-Tac-Toe");
      done();
    });
  });
});
