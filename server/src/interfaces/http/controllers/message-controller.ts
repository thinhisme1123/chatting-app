// 📁 server/src/interfaces/http/controllers/message-controller.ts
import { Request, Response } from "express";
import { MessageUseCases } from "../../../application/message/message-use-case";
import { MessageRepository } from "../../repositories/message.repository";

const messageUseCases = new MessageUseCases(new MessageRepository());

export const getChatHistory = async (req: Request, res: Response) => {
  const { userA, userB } = req.params;
  try {
    const history = await messageUseCases.getChatHistory(userA, userB);
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch message history" });
  }
};
