import Sequelize, { Op } from "@sequelize/core";
import { Request, Router, Response } from "express";
import z from "zod";
import { User } from "../model/user";
import { Friends, status } from "./../model/Friends";
import { sequelize } from "./../util/data_base";
import { resolveRequest } from "./../util/friend_req";
import ca from "zod/v4/locales/ca.js";
import { error } from "console";
import route from "./debug.route";

const router = Router();

router.get("/get_profile", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("no user found");
  }
  const user = await User.findOne({
    where: {
      id: req.user?.id,
    },
  });
  if (!user) return res.status(401).send("no user found");
  const { password, ...userData } = user?.toJSON();
  res.status(200).send(userData);
});

router.post("/make_friends", async (req: Request, res: Response) => {
  try {
    const reqLinker = z
      .object({
        email: z.email().optional(),
        id: z.coerce.number().optional(),
      })
      .refine((data) => data.id || data.email, "id or email must be provided")
      .parse(req.body);

    const user = await User.findOne({
      where: {
        ...(reqLinker.id ? { id: reqLinker.id } : { email: reqLinker.email }),
      },
    });
    if (!user) return res.status(404).send("no user found");
    if (
      (reqLinker.id && reqLinker.id == req.user?.id) ||
      (reqLinker.email && reqLinker.email == req.user?.email)
    )
      return res.status(400).send("can't send friend req to yourself");

    await sequelize.transaction(async () => {
      const existingRelationBetweenUsers = await Friends.findAll({
        where: {
          [Op.and]: [
            { requesterId: { [Op.or]: [req.user?.id, user.id] } },
            { addresseeId: { [Op.or]: [req.user?.id, user.id] } },
          ],
        },
      });

      if (existingRelationBetweenUsers) {
        await resolveRequest(existingRelationBetweenUsers, req.user!, user);
        return;
      } else {
        //if no connection is already there then create one
        await Friends.create({
          requesterId: req.user!.id,
          addresseeId: user.id,
          status: status.PENDING,
        });
      }
    });

    res.status(200).send("req sent");
  } catch (er) {
    if (process.env.NODE_ENV == "development") console.log(er);
    if (er instanceof Error) res.status(400).send(er.message);
  }
});

router.get("/list_friend_req", async (req: Request, res: Response) => {
  const friendRequests = await Friends.findAll({
    where: {
      addresseeId: req.user?.id,
      status: status.PENDING,
    },
  });

  const requestors = await User.findAll({
    where: {
      id: {
        [Op.in]: friendRequests.map((r) => r.requesterId),
      },
    },
  });

  const requestorsWithoutPassword = requestors.map((user) => {
    const { password, ...restUser } = user.toJSON();
    return restUser;
  });
  res.status(200).send(requestorsWithoutPassword);
});

router.post(
  "/api/user/accept_or_reject",
  async (req: Request, res: Response) => {
    const reqBody = z
      .object({
        userIds: z.string().array(),
        action: z.enum(["accept", "reject"]),
      })
      .parse(req.body);

    const friendRequests = await Friends.findAll({
      where: {
        requesterId: { [Op.in]: reqBody.userIds },
        addresseeId: req.user?.id,
        status: status.PENDING,
      },
    });
  }
);

export default router;
