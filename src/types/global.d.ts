import { User } from "./../model/user";
import { Request } from "express";

declare global {
  namespace Express {
    export interface Request {
      user?: User;
    }
  }
}

export {};
