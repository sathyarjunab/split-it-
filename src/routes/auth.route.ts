import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "./../model/user";
import {
  userLoginValidation,
  userSignupValidator,
} from "./../util/users_split_validator";
import { ZodError } from "zod";
import { SequelizeScopeError } from "@sequelize/core";

const router = Router();

router.post("/signup", async (req, res) => {
  const userSignupBody = userSignupValidator.parse(req.body);

  const userExists = await User.findOne({
    where: {
      email: userSignupBody.email,
    },
  });

  if (userExists) res.status(401).send("user with this email already exists");

  bcrypt.hash(userSignupBody.password, 10, async function (err, hash) {
    if (err) {
      res.status(401).send({
        message: "somthing went wrong while hashing the password0",
        err,
      });
      return;
    }
    const createdUser = await User.create({
      ...userSignupBody,
      password: hash,
    });
    res.status(200).send(createdUser);
  });
});

router.post("/login", async (req, res) => {
  try {
    const userLoginBody = userLoginValidation.parse(req.body);

    const userExists = await User.findOne({
      where: { email: userLoginBody.email },
    });
    if (userExists) {
      bcrypt.compare(
        userLoginBody.password,
        userExists.password,
        (err, result) => {
          if (err || !result) {
            res
              .status(401)
              .send({ message: "please provide with the valid password" });
            return;
          }
          const { password, ...withOutPassword } = userExists.toJSON();
          const jwt_token = jwt.sign(withOutPassword, process.env.SECRATE_KEY!);
          res.status(200).send({ jwt: jwt_token });
        }
      );
    } else {
      res.status(401).send({ message: "user not found" });
    }
  } catch (Err) {
    if (Err instanceof ZodError) {
      res.status(401).send(Err.message);
    } else if (Err instanceof SequelizeScopeError) {
      res.status(500).send(Err.message);
    }
  }
});

export default router;
