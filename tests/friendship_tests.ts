import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../server/index";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoUnit from "mongo-unit";
import testData from "./authTestData.json";
import prepare from "mocha-prepare";
import { IUser, User } from "../db/models/user";

const assert = chai.assert;
chai.use(chaiHttp);

dotenv.config({ path: ".env" });

var agent: ChaiHttp.Agent;
var user1: IUser;
var user2: IUser;

describe("Friendship Tests", () => {
  before(async () => {
    agent = chai.request.agent(app);
    user1 = await User.create({ username: "Test1", password: bcrypt.hashSync("123", 12) });
    user2 = await User.create({ username: "Test2", password: bcrypt.hashSync("123", 12) });
    const users = await User.find({});
  });

  after(() => {
    mongoUnit.drop();
    agent.close();
  });

  it("Login as user 1", (done) => {
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

  it("Search users", (done) => {
    agent.get("/friend/search?search=teST").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      const results = JSON.parse(res.text).users;
      assert.equal(results.length, 1);
      assert.equal(results[0].user._id, user2._id);
      agent.get("/friend/search?search=st1").end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        const results = JSON.parse(res.text).users;
        assert.equal(results.length, 0);
        done();
      });
    });
  });

  it("Send a friend request to user 2", (done) => {
    agent
      .post("/friend/request")
      .send({
        userId: user2._id,
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 201);
        assert.equal(JSON.parse(res.text).request.requestingUser, user1._id);
        assert.equal(JSON.parse(res.text).request.requestedUser, user2._id);
        done();
      });
  });

  it("Search users", (done) => {
    agent.get("/friend/search?search=teST").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      const results = JSON.parse(res.text).users;
      assert.equal(results.length, 1);
      assert.equal(results[0].user._id, user2._id);
      assert.equal(results[0].requested, true);
      done();
    });
  });

  it("Send duplicate request", (done) => {
    agent
      .post("/friend/request")
      .send({
        userId: user2._id,
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 400);
        done();
      });
  });

  it("View outgoing request", (done) => {
    agent.get("/friend/request/outgoing").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).requestedUsers.length, 1);
      assert.equal(JSON.parse(res.text).requestedUsers[0]._id, user2._id);
      done();
    });
  });

  it("Cancel existing request", (done) => {
    agent
      .post("/friend/cancel")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        agent.get("/friend/request/outgoing").end((err, res) => {
          assert.isNull(err);
          assert.equal(res.status, 200);
          assert.equal(JSON.parse(res.text).requestedUsers.length, 0);
          done();
        });
      });
  });

  it("Cancel nonexistent request", (done) => {
    agent
      .post("/friend/cancel")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 400);
        done();
      });
  });

  it("Re-send friend request", (done) => {
    agent
      .post("/friend/request")
      .send({
        userId: user2._id,
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 201);
        done();
      });
  });

  it("Login as user 2", (done) => {
    agent
      .post("/auth/login")
      .send({
        username: "Test2",
        password: "123",
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        expect(res).to.have.cookie("connect.sid");
        done();
      });
  });

  it("View incoming request", (done) => {
    agent.get("/friend/request/incoming").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).requestingUsers.length, 1);
      assert.equal(JSON.parse(res.text).requestingUsers[0]._id, user1._id);
      done();
    });
  });

  it("Decline request", (done) => {
    agent
      .post("/friend/decline")
      .send({ userId: user1._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        done();
      });
  });

  it("Decline nonexistent request", (done) => {
    agent
      .post("/friend/decline")
      .send({ userId: user1._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 400);
        done();
      });
  });

  it("Send a friend request to user 1", (done) => {
    agent
      .post("/friend/request")
      .send({
        userId: user1._id,
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 201);
        assert.equal(JSON.parse(res.text).request.requestingUser, user2._id);
        assert.equal(JSON.parse(res.text).request.requestedUser, user1._id);
        done();
      });
  });

  it("Login as user 1", (done) => {
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

  it("Accept request", (done) => {
    agent
      .post("/friend/accept")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        done();
      });
  });

  it("Accept nonexistent request", (done) => {
    agent
      .post("/friend/accept")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 400);
        done();
      });
  });

  it("View all friends", (done) => {
    agent.get("/friend/all").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).friends.length, 1);
      assert.equal(JSON.parse(res.text).friends[0]._id, user2._id);
      done();
    });
  });

  it("Remove user 2 as a friend", (done) => {
    agent
      .post("/friend/remove")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        done();
      });
  });

  it("View all friends", (done) => {
    agent.get("/friend/all").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).friends.length, 0);
      done();
    });
  });
});
