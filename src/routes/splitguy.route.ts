import { Router } from "express";
import { splitter } from "../util/splitter";
import { SplitValidator } from "../validator/users_split_validator";

const router = Router();

router.post("/split_me", (req, res) => {
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
        const user = userSplit.get(split.userId)!;
        userSplit.set(split.userId, {
          moneyToCome: totalAmount + user.moneyToCome,
          moneyToGo: user?.moneyToGo ?? 0,
        });
      }
    });

    const payer: Array<Record<string, number>> = [];
    const receiver: Array<Record<string, number>> = [];

    for (const [key, value] of userSplit) {
      const difference = value.moneyToCome - value.moneyToGo;
      if (difference > 0) {
        receiver.push({ [key]: difference });
      } else if (difference < 0) {
        payer.push({ [key]: difference });
      }
    }

    const finalTransaction = splitter(receiver, payer);

    res.status(200).send(finalTransaction);
  } catch (er) {
    console.log(er);
    res.status(500).send({ message: "something went wrong" });
  }
});

export default router;
