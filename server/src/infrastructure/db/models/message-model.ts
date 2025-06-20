// 📁 server/src/infrastructure/db/models/message-model.ts
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  fromUserId: { type: String, required: true },
  toUserId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const MessageModel = mongoose.model("Message", MessageSchema);
