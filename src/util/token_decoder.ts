import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "./../model/user";

export const tokenDecoder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(401).send("no token given");
    }
    const payload: JwtPayload = jwt.verify(
      token,
      process.env.SECRATE_KEY!
    ) as JwtPayload;

    if (!payload || !payload.id) {
      res.status(401).send("invalid session");
      return;
    }

    const user = await User.findOne({
      where: {
        id: payload.id,
      },
    });
    if (!user) {
      res.status(401).send("no user found");
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.log(err);
    }
    res.status(401).send("invalid token try loging again");
  }
};
