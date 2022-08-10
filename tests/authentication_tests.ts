import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../server/index";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoUnit from "mongo-unit";
import { User } from "../db/models/user";

const assert = chai.assert;
chai.use(chaiHttp);

dotenv.config({ path: ".env" });

let agent: ChaiHttp.Agent;

describe("Authentication Tests", () => {
  before(async () => {
    agent = chai.request.agent(app);
    await User.create({ username: "Test1", password: bcrypt.hashSync("123", 12) });
  });

  after(async () => {
    await mongoUnit.drop();
    agent.close();
  });

  it("Register a user", (done) => {
    agent
      .post("/auth/register")
      .send({
        username: "Test2",
        password: "123",
        confirmation: "123",
      })
      .end((err, res) => {
        assert.isNull(err);
        assert.equal(res.status, 201);
        expect(res).to.have.cookie("connect.sid");
        done();
      });
  });

  it("Login valid user", (done) => {
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

  it("Get user data while authenticated", (done) => {
    agent.get("/auth/user").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      assert.equal(JSON.parse(res.text).user.username, "Test1");
      done();
    });
  });

  it("Logout user", (done) => {
    agent.post("/auth/logout").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 200);
      done();
    });
  });

  it("Get user data while not authenticated", (done) => {
    agent.get("/auth/user").end((err, res) => {
      assert.isNull(err);
      assert.equal(res.status, 401);
      done();
    });
  });
});
