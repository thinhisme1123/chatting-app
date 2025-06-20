import { Express } from "express";
import authRoutes from "./auth-route";
import messageRoutes from "./message-route";

export const mainRoutes = (app: Express) => {
  app.use("/auth", authRoutes);
  app.use("/messages", messageRoutes);
};
