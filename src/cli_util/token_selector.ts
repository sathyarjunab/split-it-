import { promises } from "dns";
import keytar from "keytar";
import { tokenInfo } from "src/cli/server";

export interface accountInfo {
  account: string;
  token: string;
  default: boolean;
  id: number;
}

export const tokenSelector = async (
  userId?: string
): Promise<accountInfo | undefined> => {
  try {
    const tokens = await keytar.findCredentials("SPLIT-IT");
    if (userId && !isNaN(Number(userId))) {
      for (const token of tokens) {
        const tokenInfo: tokenInfo = JSON.parse(token.password);
        if (tokenInfo.id == Number(userId)) {
          return { ...tokenInfo, account: token.account };
        }
      }
    } else {
      for (const token of tokens) {
        const tokenInfo: tokenInfo = JSON.parse(token.password);
        if (tokenInfo.default) {
          return { ...tokenInfo, account: token.account };
        }
      }
    }
    console.error("❌ No token found");
    process.exit(1);
  } catch (err) {
    console.warn("Invalid token entry in the dic:", err);
  }
};

export const defaultChecker = async () => {
  const token = await keytar.findCredentials("SPLIT-IT");
  return token.filter((t) => JSON.parse(t.password).default).length == 0;
};

export const getIncrement = async (email: string) => {
  const tokens = await keytar.findCredentials("SPLIT-IT");
  // if the token exist for the account already or not
  const existingToken = tokens.find((t) => t.account == email);
  if (existingToken) {
    return JSON.parse(existingToken.password).id;
  } else {
    return tokens.length + 1;
  }
};
