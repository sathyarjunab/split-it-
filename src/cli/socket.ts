#!/usr/bin/env node

import { Command } from "commander";
import { open } from "fs";
import inquirer from "inquirer";
import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000", {
  perMessageDeflate: false,
});

export const socketCommand = (program: Command) => {
  const socket = program.command("socket").description("socket operations");

  socket.command("connect").action(async (option) => {
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
      console.log(instruction.Input);
      if (instruction.Input == "exit") {
        ws.send("exit");
        console.log("returned");
        return;
      }
      ws.send(instruction.Input);
      await getInput();
    }
    await getInput();
  });
};
