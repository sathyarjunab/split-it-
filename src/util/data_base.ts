import { Sequelize } from "@sequelize/core";
import { MySqlDialect } from "@sequelize/mysql";

import dotenv from "dotenv";
import { User } from "../model/user";
import { Friends } from "../model/Friends";
dotenv.config();

export const sequelize = new Sequelize({
  dialect: MySqlDialect,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  models: [User, Friends],
});
