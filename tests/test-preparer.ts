import prepare from "mocha-prepare";
import mongoUnit from "mongo-unit";
import { connectToMongoose } from "../server";

prepare((done) => {
  mongoUnit.start().then((testMongoUrl) => {
    process.env.MONGO_URI = testMongoUrl;
    connectToMongoose().then(() => done());
  });
});
