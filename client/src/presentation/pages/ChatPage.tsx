// 📁 ChatPage.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  Send,
  Search,
  Plus,
  Settings,
  LogOut,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { User } from "@/src/domain/entities/User";
import { AuthUseCases } from "@/src/application/usecases/AuthUseCases";
import { AuthRepository } from "@/src/infrastructure/repositories/AuthRepository";
import { Message } from "@/src/domain/entities/Message";

const socket: Socket = io("http://localhost:3001");

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[] | null>([]);
  const authUseCases = new AuthUseCases(new AuthRepository());

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await authUseCases.getAllUsers(user?.id as string);
      setUsers(data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!user) return;

    socket.emit("register-user", user.id);

    socket.on("receive-message", (data: any) => {
      const message = {
        ...data,
        isOwn: false,
      };

      // Only add if this is the selected chat
      if (
        selectedUser?.id === data.fromUserId ||
        selectedUser?.id === data.toUserId
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("receive-message");
    };
  }, [user, selectedUser]);

  // fetch chat history
  useEffect(() => {
    if (selectedUser && user) {
      const fetchHistory = async () => {
        const res = await fetch(
          `http://localhost:3001/messages/history/${user.id}/${selectedUser.id}`
        );
        const data = await res.json();
        setMessages(
          data.map((msg: Message) => ({
            ...msg,
            isOwn: msg.fromUserId === user.id,
          }))
        );
      };

      fetchHistory();
    }
  }, [selectedUser]);

  // when new message appear
  useEffect(() => {
    if (messages.length === 0) return;
    const el = document.querySelector("#chat-end");
    el?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle user selection
  const handleUserSelect = (selectedUserData: User) => {
    setSelectedUser(selectedUserData);
    // Clear messages when switching users - you might want to load chat history here
    setMessages([]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const message = {
      id: Date.now().toString(),
      senderId: user?.id,
      senderName: user?.username || "Bạn",
      content: newMessage,
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, message]);
    setTimeout(() => {
      const el = document.querySelector("#chat-end");
      el?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    socket.emit("send-message", {
      fromUserId: user?.id,
      toUserId: selectedUser.id,
      senderName: user?.username,
      message: newMessage,
    });

    setNewMessage("");
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar - User List */}
      <div className="w-90 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tin nhắn</h2>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {users?.map((userItem) => (
              <div
                key={userItem.id}
                onClick={() => handleUserSelect(userItem)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUser?.id === userItem.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={userItem.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {userItem.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {userItem.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">
                      {userItem.username}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {userItem.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    ID: {userItem.id}
                  </p>
                </div>

                <Badge className="text-xs bg-green-100 text-green-600">
                  Online
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Current User Info */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>
                {user?.username?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium">{user?.username}</h4>
              <p className="text-sm text-green-600">Online</p>
              <p className="text-xs text-gray-400">ID: {user?.id}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={selectedUser.avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {selectedUser.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedUser.username}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedUser.isOnline
                      ? "Đang hoạt động"
                      : "Không hoạt động"}
                  </p>
                  <p className="text-xs text-gray-400">ID: {selectedUser.id}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.isOwn ? "flex-row-reverse" : ""
                    }`}
                  >
                    {!message.isOwn && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>
                          {message.senderName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`flex flex-col ${
                        message.isOwn ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          message.isOwn
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                ))}

                <div id="chat-end" />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Nhập tin nhắn gửi ${selectedUser.username}...`}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          // No user selected state
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chọn một cuộc trò chuyện
              </h3>
              <p className="text-gray-500">
                Chọn một người dùng từ danh sách bên trái để bắt đầu trò chuyện
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
