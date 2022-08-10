import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../server/index";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoUnit from "mongo-unit";
import { IUser, User } from "../db/models/user";

const assert = chai.assert;
chai.use(chaiHttp);

dotenv.config({ path: ".env" });

let agent1: ChaiHttp.Agent;
let agent2: ChaiHttp.Agent;
let user1: IUser;
let user2: IUser;

describe("Friendship Tests", () => {
  before(async () => {
    agent1 = chai.request.agent(app);
    agent2 = chai.request.agent(app);
    user1 = await User.create({ username: "Test1", password: bcrypt.hashSync("123", 12) });
    user2 = await User.create({ username: "Test2", password: bcrypt.hashSync("123", 12) });
  });

  after(() => {
    mongoUnit.drop();
    agent1.close();
    agent2.close();
  });

  it("Login agents", (done) => {
    agent1
      .post("/auth/login")
      .send({
        username: "Test1",
        password: "123",
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        expect(res).to.have.cookie("connect.sid");
        agent2
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
  });

  it("Search users", (done) => {
    agent1.get("/friend/search?search=teST").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      const results = JSON.parse(res.text).users;
      assert.equal(results.length, 1);
      assert.equal(results[0].user._id, user2._id);
      agent1.get("/friend/search?search=st1").end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        const results = JSON.parse(res.text).users;
        assert.equal(results.length, 0);
        done();
      });
    });
  });

  it("Send a friend request to user 2", (done) => {
    agent1
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
    agent1.get("/friend/search?search=teST").end((err, res) => {
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
    agent1
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
    agent1.get("/friend/request/outgoing").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).requestedUsers.length, 1);
      assert.equal(JSON.parse(res.text).requestedUsers[0]._id, user2._id);
      done();
    });
  });

  it("Cancel existing request", (done) => {
    agent1
      .post("/friend/cancel")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        agent1.get("/friend/request/outgoing").end((err, res) => {
          assert.isNull(err);
          assert.equal(res.status, 200);
          assert.equal(JSON.parse(res.text).requestedUsers.length, 0);
          done();
        });
      });
  });

  it("Cancel nonexistent request", (done) => {
    agent1
      .post("/friend/cancel")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 400);
        done();
      });
  });

  it("Re-send friend request", (done) => {
    agent1
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

  it("View incoming request", (done) => {
    agent2.get("/friend/request/incoming").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).requestingUsers.length, 1);
      assert.equal(JSON.parse(res.text).requestingUsers[0]._id, user1._id);
      done();
    });
  });

  it("Decline request", (done) => {
    agent2
      .post("/friend/decline")
      .send({ userId: user1._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        done();
      });
  });

  it("Decline nonexistent request", (done) => {
    agent2
      .post("/friend/decline")
      .send({ userId: user1._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 400);
        done();
      });
  });

  it("Send a friend request to user 1", (done) => {
    agent2
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

  it("Accept request", (done) => {
    agent1
      .post("/friend/accept")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        done();
      });
  });

  it("Accept nonexistent request", (done) => {
    agent1
      .post("/friend/accept")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 400);
        done();
      });
  });

  it("View all friends", (done) => {
    agent1.get("/friend/all").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).friends.length, 1);
      assert.equal(JSON.parse(res.text).friends[0]._id, user2._id);
      done();
    });
  });

  it("Remove user 2 as a friend", (done) => {
    agent1
      .post("/friend/remove")
      .send({ userId: user2._id })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 200);
        done();
      });
  });

  it("View all friends", (done) => {
    agent1.get("/friend/all").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).friends.length, 0);
      done();
    });
  });
});
