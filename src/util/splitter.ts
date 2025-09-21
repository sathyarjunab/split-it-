export const splitter = (
  receivers: Array<Record<string, number>>,
  payers: Array<Record<string, number>>
): Array<string> => {
  const resultBook: string[] = [];
  // Normalize payer values to positive (amount they owe)
  payers = payers.map((p) => {
    let key = Object.keys(p)[0];
    return { [key]: Math.abs(p[key]) };
  });

  // Sort
  receivers.sort((a, b) => Object.values(a)[0] - Object.values(b)[0]);
  payers.sort((a, b) => Object.values(a)[0] - Object.values(b)[0]);

  let j = 0;
  payers.forEach((payer) => {
    let payerName = Object.keys(payer)[0];
    let amountAvailable = payer[payerName];

    while (amountAvailable > 0 && j < receivers.length) {
      let recName = Object.keys(receivers[j])[0];
      let needToPay = receivers[j][recName];

      if (needToPay > amountAvailable) {
        // Payer pays part of receiver’s need
        receivers[j][recName] -= amountAvailable;

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
        receivers[j][recName] = 0;
        j++; // move to next receiver
      }
    }
  });
  return resultBook;
};
