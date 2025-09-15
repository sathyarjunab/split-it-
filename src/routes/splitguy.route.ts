import { Router } from "express";
import { spliter } from "../util/spliter";
import { SplitValidator } from "../util/users_split_validator";

const router = Router();

router.get("/split_me", (req, res) => {
  try {
    const parsedBody = SplitValidator.array().parse(req.body);

    const userSplit = new Map<
      string,
      { moneyToCome: number; moneyToGo: number }
    >();

    parsedBody.forEach((split) => {
      let totalAmount = 0;
      split.moneyBorrower.forEach((borrower) => {
        if (!userSplit.has(borrower.userId)) {
          userSplit.set(borrower.userId, {
            moneyToGo: borrower.amount,
            moneyToCome: 0,
          });
        } else {
          const user = userSplit.get(borrower.userId);
          userSplit.set(borrower.userId, {
            moneyToGo: (user?.moneyToGo ?? 0) + borrower.amount,
            moneyToCome: user?.moneyToCome ?? 0,
          });
        }
        totalAmount += borrower.amount;
      });
      if (!userSplit.has(split.userId)) {
        userSplit.set(split.userId, { moneyToCome: totalAmount, moneyToGo: 0 });
      } else {
        const user = userSplit.get(split.userId);
        userSplit.set(split.userId, {
          moneyToCome: totalAmount,
          moneyToGo: user?.moneyToGo ?? 0,
        });
      }
    });

    const usersOverAllPosition: Record<string, number> = {};

    const payer: Array<Record<string, number>> = [];
    const reciver: Array<Record<string, number>> = [];

    for (const [key, value] of userSplit) {
      usersOverAllPosition[key] = value.moneyToCome - value.moneyToGo;
      if (usersOverAllPosition[key] > 0) {
        reciver.push({ [key]: usersOverAllPosition[key] });
      } else if (usersOverAllPosition[key] < 0) {
        payer.push({ [key]: usersOverAllPosition[key] });
      }
    }

    const finalTransaction = spliter(reciver, payer);

    res.status(200).send(finalTransaction);
  } catch (er) {
    console.log(er);
    res.status(500).send({ message: "something went wrong" });
  }
});

export default router;
