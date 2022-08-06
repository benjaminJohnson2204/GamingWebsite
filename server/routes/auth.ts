import { Request, Response } from "express";
import { IUser, User } from "../../db/models/user";

const router = require("express").Router();
const passport = require("passport");
const bcrypt = require("bcrypt");

const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
};

router.get("/user", ensureAuthenticated, (req: Request, res: Response) => {
  return res.status(200).json({ user: req.user });
});

router.post(
  "/register",
  async (req: Request, res: Response, next: Function) => {
    if (req.body.password != req.body.confirmation) {
      return res.status(400).json({ error: "passwords don't match" });
    }
    const hash = bcrypt.hashSync(req.body.password, 12);
    const user: IUser | null = await User.findOne({ username: req.body.username });
    if (user) {
      return res.status(400).json({ error: "username already taken" });
    }
    const newUser: IUser = await User.create({ username: req.body.username, password: hash });
    if (newUser) {
      req.login(newUser, (error: any) => {
        if (error) {
          return next(error);
        }
        return next(null, newUser);
      });
    } else {
      return res.status(500).json({ error: "could not register user" });
    }
  },
  passport.authenticate("local"),
  (req: Request, res: Response) => {
    res.status(200).json("Successfully registered");
  }
);

router.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/auth/invalid" }),
  (req: Request, res: Response) => {
    res.status(200).json("Successfully logged in");
  }
);

router.get("/logout", (req: Request, res: Response) => {
  req.logout({}, (error) => {
    if (error) {
      res.status(500).json({ error: "Could not logout" });
    } else {
      res.status(200).json("Successfully logged out");
    }
  });
});

router.get("/invalid", (req: Request, res: Response) => {
  return res.status(401).json({ error: "Not authenticated" });
});

export { router, ensureAuthenticated };
