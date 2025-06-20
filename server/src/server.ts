// 📁 server/src/server.ts
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { mainRoutes } from './routes';

// Load env vars
dotenv.config();

// Express setup
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

mainRoutes(app);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// In-memory map to store userId <-> socketId
const onlineUsers = new Map<string, string>();

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('register-user', (userId: string) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ Registered user: ${userId} -> socket ${socket.id}`);
    io.emit('online-users', Array.from(onlineUsers.keys()));
  });

  socket.on('send-message', ({ fromUserId, toUserId, message }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    console.log(`📨 Message from ${fromUserId} to ${toUserId}: ${message}`);
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive-message', {
        fromUserId,
        message,
      });
    } else {
      console.log(`⚠️ User ${toUserId} is offline or not registered.`);
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUserId: string | null = null;

    for (const [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      console.log(`❌ User disconnected: ${disconnectedUserId}`);
    } else {
      console.log(`❌ Unknown socket disconnected: ${socket.id}`);
    }

    io.emit('online-users', Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
