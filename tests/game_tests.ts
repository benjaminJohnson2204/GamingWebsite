import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../server/index";
import dotenv from "dotenv";
import mongoUnit from "mongo-unit";
import { GameType } from "../db/models/gameType";
import { User } from "../db/models/user";
import bcrypt from "bcrypt";

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
      numPlayers: 1, // To simplify testing
    });
    await User.create({ username: "Test1", password: bcrypt.hashSync("123", 12) });
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

  it("Login agent", (done) => {
    agent
      .post("/auth/login")
      .send({
        username: "Test1",
        password: "123",
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        expect(res).to.have.cookie("connect.sid");
        done();
      });
  });

  it("Add a game", (done) => {
    agent
      .post("/game/add")
      .send({
        gameType: "tic-tac-toe",
        score: 10,
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        assert.equal(res.body.game.score, 10);
        done();
      });
  });

  it("Get all past games", (done) => {
    agent.get("/game/all").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(res.body.games.length, 1);
      assert.equal(res.body.games[0].score, 10);
      done();
    });
  });

  it("Get past games by game type", (done) => {
    agent.get("/game-type/tic-tac-toe").end((err, res) => {
      agent.get(`/game/${res.body._id}`).end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        assert.equal(res.body.games.length, 1);
        assert.equal(res.body.games[0].score, 10);
        done();
      });
    });
  });
});
