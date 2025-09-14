import z from "zod";
import { SplitValidator } from "./users_split_validator";

export const spliter = (
  recivers: Array<Record<string, number>>,
  payers: Array<Record<string, number>>
): Array<string> => {
  const resultBook: string[] = [];
  // Normalize payer values to positive (amount they owe)
  payers = payers.map((p) => {
    let key = Object.keys(p)[0];
    return { [key]: Math.abs(p[key]) };
  });

  // Sort
  recivers.sort((a, b) => Object.values(a)[0] - Object.values(b)[0]);
  payers.sort((a, b) => Object.values(a)[0] - Object.values(b)[0]);

  let j = 0;
  payers.forEach((payer) => {
    let payerName = Object.keys(payer)[0];
    let amountAvailable = payer[payerName];

    while (amountAvailable > 0 && j < recivers.length) {
      let recName = Object.keys(recivers[j])[0];
      let needToPay = recivers[j][recName];

      if (needToPay > amountAvailable) {
        // Payer pays part of receiver’s need
        recivers[j][recName] -= amountAvailable;

        resultBook.push(
          `${payerName} pays to ${recName} - amount ${amountAvailable}`
        );

        amountAvailable = 0;
      } else {
        // Payer covers full receiver need
        resultBook.push(
          `${payerName} pays to ${recName} - amount ${needToPay}`
        );
        amountAvailable -= needToPay;
        recivers[j][recName] = 0;
        j++; // move to next receiver
      }
    }
  });
  return resultBook;
};
