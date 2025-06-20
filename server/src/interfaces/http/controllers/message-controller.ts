import { Request, Response } from "express";
import MessageModel from "../../../infrastructure/db/models/message-model";

export const saveMessageController = async (req: Request, res: Response) => {
    try {
    const { senderId, receiverId, senderName, content, timestamp } = req.body;
    
    const newMessage = new MessageModel({
      senderId,
      receiverId,
      senderName,
      content,
      timestamp: timestamp || new Date()
    });
    
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
}