#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import WebSocket from "ws";

let ws: WebSocket;

export const socketCommand = (program: Command) => {
  const socket = program.command("socket").description("socket operations");

  socket.command("connect").action(async (option) => {
    ws = new WebSocket(process.env.BACKEND_URL!, {
      perMessageDeflate: false,
    });
    // ws on error
    ws.on("error", console.error);
    // ws when it opens
    ws.on("open", function open() {
      console.log("socket is now open to send data");
    });

    //ws when you get message
    ws.on("message", function message(data) {
      // data = JSON.parse(data);
      console.log("message i got", data.toString());
    });
    async function getInput() {
      const instruction = await inquirer.prompt([
        {
          type: "input",
          name: "Input",
          message: "message to socket",
        },
      ]);
      if (instruction.Input == "exit") {
        ws.send("exit");
        console.log("exited from the socket connection");
        process.exit(0);
        return;
      }
      ws.send(instruction.Input);
      await getInput();
    }
    await getInput();
  });
};
