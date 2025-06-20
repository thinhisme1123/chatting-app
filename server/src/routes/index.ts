import { Express } from "express";
import authRoutes from "./auth-route";
import messgaeRoutes from "./message-route";

export const mainRoutes = (app: Express) => {
  app.use("/auth", authRoutes);
  app.use("/message", messgaeRoutes);
};
