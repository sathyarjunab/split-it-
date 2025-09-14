#!/usr/bin/env node

import { Command } from "commander";
import api from "../../axios_config";

export const clientCommand = (program: Command) => {
  const socket = program.command("client").description("client operations");
};
