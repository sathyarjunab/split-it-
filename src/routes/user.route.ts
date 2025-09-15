import { Op } from "@sequelize/core";
import { Request, Response, Router } from "express";
import z, { ZodError } from "zod";
import { User } from "../model/user";
import { Friends, status } from "./../model/Friends";
import { sequelize } from "./../util/data_base";
import { resolveRequest } from "./../util/friend_req";

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

router.post("/accept_or_reject", async (req: Request, res: Response) => {
  try {
    const reqBody = z
      .object({
        userIds: z.int().positive().array(),
        //true means req accepted false means rejected
        action: z.boolean(),
      })
      .parse(req.body);

    const friendRequests = await Friends.findAll({
      where: {
        requesterId: { [Op.in]: reqBody.userIds },
        addresseeId: req.user?.id,
        status: status.PENDING,
      },
    });

    if (
      friendRequests.length == 0 ||
      friendRequests.length != reqBody.userIds.length
    )
      return res
        .status(400)
        .send(
          "you are giving the wrong ids only give the ids you see in the user object so that you can accept or reject the requests"
        );

    if (reqBody.action) {
      await sequelize.transaction(async () => {
        for (const request of friendRequests) {
          request.status = status.ACCEPTED;
          await request.save();
        }
      });
      res
        .status(200)
        .send(
          `accepted you have a new ${
            friendRequests.length > 1 ? "friends" : "friend"
          }`
        );
    } else {
      await sequelize.transaction(async () => {
        for (const request of friendRequests) {
          request.status = status.DECLINED;
          await request.save();
        }
      });
      res.status(200).send("rejected");
    }
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(401).send(err.message);
    }
  }
});

router.post("/list_friends", async (req: Request, res: Response) => {
  const friends = await Friends.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: {
            requesterId: req.user?.id,
            addresseeId: req.user?.id,
          },
        },
        {
          status: status.ACCEPTED,
        },
      ],
    },
  });

  const friendsId = friends.map((f) => {
    if (f.addresseeId == req.user?.id) return f.requesterId;
    return f.addresseeId;
  });

  const users = await User.findAll({
    where: {
      id: {
        [Op.in]: friendsId,
      },
    },
  });

  res.status(200).send(users);
});

export default router;
