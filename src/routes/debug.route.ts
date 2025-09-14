import { Router } from "express";

const route = Router();

route.get("/test", (_req, res) => {
  res.status(200).send("yos brother working");
});

export default route;
