import WebSocket, { RawData } from "node_modules/@types/ws/index.mjs";

export function messageHandler(this: WebSocket, msg: RawData) {
  const msgInStringFormate = msg.toString();

  if (msgInStringFormate == "ding") {
    this.send("dong");
  }
}

export function closeHandler(this: WebSocket, msg: RawData) {}
