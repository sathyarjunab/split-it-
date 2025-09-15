#!/usr/bin/env node

import { isAxiosError } from "axios";
import { Command } from "commander";
import inquirer from "inquirer";
import keytar from "keytar";
import api from "../../axios_config";
import {
  defaultChecker,
  getIncrement,
  tokenSelector,
} from "../cli_util/token_selector";
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
            id: await getIncrement(user.email),
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
        const email = (await tokenSelector(userId))?.account;

        if (!email) {
          console.log("provide with the proper token id");
          process.exit(1);
        }
        await keytar.deletePassword("SPLIT-IT", email);
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
    .action(async (option) => {});
};
