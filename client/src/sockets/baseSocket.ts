// sockets/baseSocket.ts
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export const socket: Socket = io(API_URL, {
  autoConnect: false, 
  transports: ["websocket"],
});
