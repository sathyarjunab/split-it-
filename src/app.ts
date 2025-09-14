import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import debug from "./routes/debug.route";
import splitGuyRoutes from "./routes/splitguy.route";
import userRouter from "./routes/user.route";
import { sequelize } from "./util/data_base";
import { closeHandler, messageHandler } from "./util/websocket_transaction";
import { tokenDecoder } from "./util/token_decoder";
import authRoutes from "./routes/auth.route";

dotenv.config();

const app: Application = express();
const server = createServer(app);

export const wss = new WebSocketServer({ server });

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", messageHandler.bind(ws));

  ws.on("close", closeHandler.bind(ws));

  ws.on("ping", () => {
    ws.pong();
  });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/debug", debug);
app.use("/api/auth", authRoutes);
app.use(tokenDecoder);
app.use("/api/user", userRouter);
app.use("/api/split", splitGuyRoutes);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  console.log("Database connected successfully.");
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
