#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";
import { printBoard, winnerChecker } from "./../util/tick_tak_toe";
import { count } from "console";
import { exit } from "process";

export const clientCommand = (program: Command) => {
  const client = program.command("client").description("client operations");
  client
    .command("tik_tak_toe")
    .option("-n, --board-size <number>", "board size")
    .description("Play Tic Tac Toe")
    .action(async (option) => {
      let n = parseInt(option.boardSize, 10) || 3;
      const board = Array(n)
        .fill(0)
        .map(() => Array(n).fill(""));
      printBoard(board);
      let counter = 0;
      while (true) {
        counter++;
        const { coordinate } = await inquirer.prompt([
          {
            type: "input",
            name: "coordinate",
            message: `${counter % 2 == 0 ? "O TURN" : "X TURN"}: enter row,col`,
          },
        ]);

        if (coordinate == "exit") break;

        let [x, y] = coordinate.split(",").map(Number);
        if (isNaN(x) || isNaN(y) || x >= n || y >= n || x < 0 || y < 0) {
          console.log("invalid input");
          counter--;
          continue;
        }

        if (board[x][y] !== "") {
          console.log("place already taken");
          counter--;
          continue;
        }

        board[x][y] = counter % 2 == 0 ? "O" : "X";
        printBoard(board);

        if (winnerChecker(board)) {
          console.log(`🎉 ${counter % 2 == 0 ? "O" : "X"} WINS 🎉`);
          break;
        }

        // check draw
        if (board.flat().every((v) => v !== "")) {
          console.log("😐 It's a draw!");
          break;
        }
      }
      process.exit(0);
    });
};
