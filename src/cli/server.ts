#!/usr/bin/env node

import { isAxiosError } from "axios";
import { Command } from "commander";
import inquirer from "inquirer";
import keytar from "keytar";
import api from "../../axios_config";
import {
  defaultChecker,
  getLength,
  makeTokenDefault,
  tokenSelector,
} from "../cli_util/token.util";
import { User } from "src/model/user";

export interface tokenInfo {
  token: string;
  default: boolean;
  id: number;
}

export const serverCommand = (program: Command) => {
  const server = program.command("server").description("server operations");

  server
    .command("signup")
    .description("well it's self explanatory you signup")
    .action(async () => {
      try {
        const userSignupBody = await inquirer.prompt([
          {
            type: "input",
            name: "name",
            message: "enter you name",
          },
          {
            type: "input",
            name: "email",
            message: "enter you email ",
          },
          {
            type: "password",
            name: "password",
            message: "enter you password",
          },
        ]);
        const resp = await api.post("api/auth/signup", {
          name: userSignupBody.name,
          email: userSignupBody.email,
          password: userSignupBody.password,
        });
        console.log(
          `you have been logged in ${userSignupBody.name},please sign up once to start with this all in one project`
        );
        process.exit(0);
      } catch (err) {
        if (isAxiosError(err)) {
          if (err.response) {
            console.error("❌ Axios error:", err.response.status);
            console.error("❌ Axios error:", err.response.statusText);
            console.error("❌ Axios error:", err.response.data);
          }
        } else {
          console.error("❌ Unexpected error:", (err as Error).message);
        }
        process.exit(0);
      }
    });

  server
    .command("login")
    .description("login to the application")
    .action(async () => {
      try {
        const user = await inquirer.prompt([
          {
            type: "input",
            name: "email",
            message: "enter your mail id",
          },
          {
            type: "password",
            name: "password",
            message: "enter your password",
          },
        ]);

        const jwt_token = await api.post("/api/auth/login", {
          email: user.email,
          password: user.password,
        });

        await keytar.setPassword(
          "SPLIT-IT",
          user.email,
          JSON.stringify({
            token: jwt_token.data.jwt,
            default: await defaultChecker(),
            id: await getLength(user.email),
          })
        );
        console.log("hi there", user.email);
        process.exit(0);
      } catch (err) {
        if (isAxiosError(err)) {
          if (err.response) {
            console.error("❌ Axios error:", err.response.status);
            console.error("❌ Axios error:", err.response.statusText);
            console.error("❌ Axios error:", err.response.data);
          }
        } else {
          console.error("❌ Unexpected error:", (err as Error).message);
        }
        process.exit(0);
      }
    });

  server
    .command("get_profile")
    .description("to get the profile details")
    .option("-u --user <userId>", "user id")
    .action(async (option) => {
      const token = (await tokenSelector(option.user))?.token;
      const { data: profile } = await api.get("/api/user/get_profile", {
        headers: {
          Authorization: token,
        },
      });
      console.log(profile);
      process.exit(0);
    });

  server
    .command("get_tokens")
    .description("get's you the jwt token for the backend server")
    .action(async () => {
      (await keytar.findCredentials("SPLIT-IT")).forEach((token) => {
        console.log(token.account, JSON.parse(token.password));
      });
      process.exit(0);
    });

  server
    .command("remove_token")
    .description("remove the token")
    .option("-u --user <id>", "user id")
    .action(async (option) => {
      const userId = option.user;
      if (userId && !isNaN(Number(userId))) {
        const account = await tokenSelector(userId);

        if (!account) {
          console.log("provide with the proper token id");
          process.exit(1);
        }
        const email = account.account;
        if (email) await keytar.deletePassword("SPLIT-IT", email);
        if (account.default) await makeTokenDefault();
        console.log("token removed");
        process.exit(0);
      } else {
        console.log("provide with the proper token id");
        process.exit(1);
      }
    });

  server
    .command("make_friends")
    .description(
      "make friends with the user by giving the users mail or id options -m or --mail or for the id give -Id or --ID"
    )
    .option("-f --friendID <id>", "id of the user")
    .option("-m --mail <mailId>", "mail id")
    .option("-u --user <id>", "id of the user")
    .action(async (options) => {
      try {
        if (
          (!options.friendID && !options.mail) ||
          (options.friendID && options.mail)
        ) {
          console.error(
            "❌ You must provide either --ID or --mail, but not both."
          );
          process.exit(1);
        }
        const token = (await tokenSelector(options.user))?.token;
        const { data: friends } = await api.post(
          "/api/user/make_friends",
          {
            email: options.mail,
            id: options.friendID,
          },
          {
            headers: {
              Authorization: token,
            },
          }
        );
        console.log(friends);
        process.exit(0);
      } catch (err) {
        if (isAxiosError(err)) {
          if (err.response) {
            console.error("❌ Axios error:", err.response.status);
            console.error("❌ Axios error:", err.response.statusText);
            console.error("❌ Axios error:", err.response.data);
          }
        } else {
          console.error("❌ Unexpected error:", (err as Error).message);
        }
        process.exit(1);
      }
    });

  server
    .command("list_friend_req")
    .description("lists the friend requests")
    .option("-u --user <id>", "user id")
    .action(async (option) => {
      try {
        const token = (await tokenSelector(option.user))?.token;
        const friendRequests = (
          await api.get("/api/user/list_friend_req", {
            headers: {
              Authorization: token,
            },
          })
        ).data as Omit<User, "password">[];
        console.log("friendRequests", friendRequests);

        if (friendRequests.length > 0) {
          const options = await inquirer.prompt([
            {
              type: "input",
              name: "accept/reject",
              message:
                "accept or reject option or enter exit to exit this loop",
            },
            {
              type: "input",
              name: "userIds",
              message: "user ids to accept or reject separated by comma",
              when: (answers) =>
                answers["accept/reject"] == "accept" ||
                answers["accept/reject"] == "reject",
            },
          ]);

          if (
            options["accept/reject"] != "accept" &&
            options["accept/reject"] != "reject"
          ) {
            console.log("exited");
            process.exit(0);
          }

          const isValid = /^(\d+\s*)(,\s*\d+\s*)*$/.test(options.userIds);

          if (!isValid) {
            console.log("invalid input");
            process.exit(1);
          }

          const userIds: number[] = options.userIds
            .split(",")
            .map((id: string) => Number(id));

          if (options["accept/reject"] == "exit") {
            process.exit(0);
          }

          const resp = await api.post(
            "/api/user/accept_or_reject",
            {
              userIds: userIds,
              action: options["accept/reject"] == "accept" ? true : false,
            },
            {
              headers: {
                Authorization: token,
              },
            }
          );
          console.log(resp.status);
          console.log(resp.data);
        }

        process.exit(0);
      } catch (err) {
        if (isAxiosError(err)) {
          if (err.response) {
            console.error("❌ Axios error:", err.response.status);
            console.error("❌ Axios error:", err.response.statusText);
            console.error("❌ Axios error:", err.response.data);
          }
        } else {
          console.error("❌ Unexpected error:", (err as Error).message);
        }
        process.exit(1);
      }
    });

  server
    .command("list_friends")
    .description("list all the friends of the user")
    .option("-u --user <id>", "user id")
    .option("-t --type <followers>", "followers or followers")
    .action(async (option) => {
      try {
        const token = (await tokenSelector(option.user))?.token;
        if (option.type !== "follows" && option.type !== "followers") {
          console.log(
            "give me the type of friends you want followers or follows by  doing this (-t followers | follows) "
          );
          process.exit(1);
        }

        const resp = await api.get("/api/user/list_friends", {
          params: {
            type: option.type,
          },
          headers: {
            Authorization: token,
          },
        });

        console.log(resp.data);

        process.exit(0);
      } catch (error: any) {
        console.log(error.data);
        process.exit(1);
      }
    });

  server
    .command("split_it")
    .description("give the money split")
    .option("-u --user <id>", "user id")
    .action(async (option) => {
      try {
        const token = (await tokenSelector(option.user))?.token;

        if (!token) {
          console.error("❌ No token found");
          process.exit(1);
        }

        console.log(
          "👉 Enter split details. Type 'exit' as the username when done.\n"
        );

        // This will hold all the splits
        const reqBody: Array<{
          userId: string;
          moneyBorrower: Array<{ userId: string; amount: number }>;
        }> = [];

        // loop to build request body
        let exitLoop = false;
        while (!exitLoop) {
          const { lender } = await inquirer.prompt([
            {
              type: "input",
              name: "lender",
              message: "Enter lender userId (or 'exit' to finish):",
            },
          ]);

          if (lender.toLowerCase() === "exit") {
            exitLoop = true;
            break;
          }

          const { numBorrowers } = await inquirer.prompt([
            {
              type: "number",
              name: "numBorrowers",
              message: "How many borrowers for this split?",
              validate: (input) =>
                (input ?? 0) > 0 ? true : "Must have at least one borrower",
            },
          ]);

          const moneyBorrower: Array<{ userId: string; amount: number }> = [];
          for (let i = 0; i < numBorrowers; i++) {
            const borrower = await inquirer.prompt([
              {
                type: "input",
                name: "borrowerId",
                message: `Borrower #${i + 1} userId:`,
              },
              {
                type: "number",
                name: "amount",
                message: `Amount borrower #${i + 1} owes:`,
                validate: (val) =>
                  (val ?? 0) > 0 ? true : "Amount must be greater than 0",
              },
            ]);
            moneyBorrower.push({
              userId: borrower.borrowerId,
              amount: borrower.amount,
            });
          }

          reqBody.push({ userId: lender, moneyBorrower });
        }

        if (reqBody.length === 0) {
          console.log("❌ No splits entered. Exiting.");
          process.exit(0);
        }

        // Send request
        const resp = await api.post("/api/split/split_me", reqBody, {
          headers: { Authorization: token },
        });

        console.log("✅ Final Transactions:");
        resp.data.forEach((line: string) => console.log("   ", line));

        process.exit(0);
      } catch (err) {
        if (isAxiosError(err)) {
          if (err.response) {
            console.error("❌ Axios error:", err.response.status);
            console.error("❌ Axios error:", err.response.statusText);
            console.error("❌ Axios error:", err.response.data);
          }
        } else {
          console.error("❌ Unexpected error:", (err as Error).message);
        }
        process.exit(1);
      }
    });
};
