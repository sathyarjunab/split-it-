#!/usr/bin/env node

import { Command } from "commander";
import { socketCommand } from "./socket";
import { serverCommand } from "./server";
import { clientCommand } from "./client";

const program = new Command();

socketCommand(program);
clientCommand(program);
serverCommand(program);

program.parse(process.argv);
