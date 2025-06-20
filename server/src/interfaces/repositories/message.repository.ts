import { MessageModel } from './../../infrastructure/db/models/message-model';
import { Message } from '../../domain/enities/message';

export class MessageRepository {
  async save(message: Omit<Message, "id">): Promise<Message> {
    const saved = await new MessageModel(message).save();
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
    };
  }

  async getChatHistory(userA: string, userB: string): Promise<Message[]> {
    const messages = await MessageModel.find({
      $or: [
        { fromUserId: userA, toUserId: userB },
        { fromUserId: userB, toUserId: userA },
      ],
    }).sort({ timestamp: 1 });

    return messages.map((msg) => ({
      ...msg.toObject(),
      id: msg._id.toString(),
    }));
  }
}
