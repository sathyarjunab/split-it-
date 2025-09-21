import { Op } from "@sequelize/core";
import { Request, Response, Router } from "express";
import { friendSchema } from "./../validator/auth_validator";
import z from "zod";
import { User } from "../model/user";
import { Friends, status } from "./../model/Friends";
import { sequelize } from "./../util/data_base";
import { resolveRequest } from "./../util/friend_req";

const router = Router();

router.get("/get_profile", async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).send("no user found");

  const user = await User.findByPk(userId);

  if (!user) return res.status(404).send("no user found");

  res.status(200).send(user?.toJSON());
});

//route handles sending friend request
router.post("/make_friends", async (req: Request, res: Response) => {
  try {
    const { email, id } = friendSchema.parse(req.body);

    const userId = req.user?.id;

    if (!userId) return res.status(401).send("unauthorized");

    const user = await User.findOne({
      where: {
        ...(id ? { id: id } : { email: email }),
      },
    });

    if (!user) return res.status(404).send("no user found");

    // Prevent self request
    if (user.id == userId)
      return res.status(400).send("can't send friend req to yourself");

    await sequelize.transaction(async () => {
      //in this only two rows should be found one for each user
      const existingRelationBetweenUsers = await Friends.findAll({
        where: {
          requesterId: { [Op.or]: [userId, user.id] },
          addresseeId: { [Op.or]: [userId, user.id] },
        },
      });

      if (existingRelationBetweenUsers.length > 0) {
        await resolveRequest(existingRelationBetweenUsers, req.user!, user);
      } else {
        //if no connection is already there then create one
        await Friends.create({
          requesterId: req.user!.id,
          addresseeId: user.id,
          status: status.PENDING,
        });
      }
    });

    res.status(200).send({ success: true, message: "Friend request sent" });
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
    attributes: ["requesterId"],
    raw: true,
  });

  if (friendRequests.length === 0) {
    return res.status(200).json([]);
  }

  const requestors = await User.findAll({
    where: {
      id: friendRequests.map((r) => r.requesterId),
    },
    attributes: ["id", "name", "email"],
    raw: true,
  });

  res.status(200).send(requestors);
});

//route handles accepting or rejecting friend request
router.post("/accept_or_reject", async (req: Request, res: Response) => {
  if (!req.user?.id) return res.status(401).send("unauthorized");
  const reqBody = z
    .object({
      userIds: z.int().positive().array().nonempty(),
      //true means req accepted false means rejected
      action: z.boolean(),
    })
    .parse(req.body);

  const friendRequests = await Friends.findAll({
    where: {
      requesterId: reqBody.userIds,
      addresseeId: req.user.id,
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

  const action = reqBody.action ? status.ACCEPTED : status.DECLINED;

  await sequelize.transaction(async (t) => {
    await Friends.update(
      {
        status: action,
      },
      {
        where: {
          addresseeId: req.user!.id,
          requesterId: reqBody.userIds,
        },
        transaction: t,
      }
    );
  });
});

router.get("/list_friends", async (req: Request, res: Response) => {
  const type = z.enum(["follows", "followers"]).parse(req.query.type);

  if (!req.user?.id) return res.status(401).send({ error: "Unauthorized " });

  const selectField = type === "followers" ? "requesterId" : "addresseeId";

  const friends = await Friends.findAll({
    where: {
      ...(type === "followers"
        ? { addresseeId: req.user.id }
        : { requesterId: req.user.id }),
      status: status.ACCEPTED,
    },
    attributes: [selectField],
  });

  if (friends.length === 0) {
    return res.status(200).json([]);
  }

  const friendsId = friends.map((f) =>
    f.requesterId ? f.requesterId : f.addresseeId
  );

  const users = await User.findAll({
    where: {
      id: {
        [Op.in]: friendsId,
      },
    },
    raw: true,
  });

  res.status(200).send(users);
});

export default router;
