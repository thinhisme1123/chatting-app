import type React from "react";
import { useState, useEffect, useRef } from "react";
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
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { User } from "@/src/domain/entities/User";
import { AuthUseCases } from "@/src/application/usecases/AuthUseCases";
import { AuthRepository } from "@/src/infrastructure/repositories/AuthRepository";
import { Message } from "@/src/domain/entities/Message";
import { playNotificationSound } from "@/src/utils/playNotificationSound";
import Link from "next/link";
import { TypingIndicator } from "../components/parts/TypingIndicator";
import { ChatUseCases } from "@/src/application/usecases/ChatUseCases";
import { ChatRepository } from "@/src/infrastructure/repositories/ChatRepository";

const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL);

export default function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[] | null>([]);
  const authUseCases = new AuthUseCases(new AuthRepository());
  const chatUseCaase = new ChatUseCases(new ChatRepository());

  const [isMobile, setIsMobile] = useState(false);

  // Typing indicator states
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [usersTyping, setUsersTyping] = useState<{ [key: string]: string }>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [newMessageUserIds, setNewMessageUserIds] = useState<string[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});

  const setUserHasNewMessage = (id: string) => {
    setNewMessageUserIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const clearNewMessageForUser = (id: string) => {
    setNewMessageUserIds((prev) => prev.filter((uid) => uid !== id));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await authUseCases.getAllUsers(user?.id as string);
      setUsers(data);
      if (Array.isArray(data) && data.length > 0 && !selectedUser) {
        clearNewMessageForUser(data[0].id);
      }
    };
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    fetchUsers();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchAllLastMessages = async () => {
      const newMessagesMap: Record<string, string> = {};

      if (!users || !user?.id) return;

      for (const userItem of users) {
        try {
          const message = await chatUseCaase.getLastMessage(
            user.id,
            userItem.id
          );
          newMessagesMap[userItem.id] = message?.content || "No messages yet.";
        } catch (err) {
          console.error(`Error fetching last message for ${userItem.id}`, err);
          newMessagesMap[userItem.id] = "Error loading message";
        }
      }

      setLastMessages(newMessagesMap);
    };

    fetchAllLastMessages();
  }, [users]);

  useEffect(() => {
    if (!user) return;

    socket.emit("register-user", user.id);

    socket.on("receive-message", (data: any) => {
      const message = {
        ...data,
        isOwn: false,
      };

      if (
        selectedUser?.id === data.fromUserId ||
        selectedUser?.id === data.toUserId
      ) {
        setMessages((prev) => [...prev, message]);
      } else {
        setUserHasNewMessage(data.fromUserId);
        document.title = `${data.senderName} đã nhắn tin cho bạn`;
        if (Notification.permission === "granted") {
          new Notification(`${data.senderName} đã đề cập đến bạn`, {
            body: message.content,
            icon: "/images/chat-icon-2.png",
          });
        }
        playNotificationSound();
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
          `${process.env.NEXT_PUBLIC_API_URL}/messages/history/${user.id}/${selectedUser.id}`
        );
        const data = await res.json();
        setMessages(
          data.map((msg: Message) => ({
            ...msg,
            isOwn: msg.fromUserId === user.id,
          }))
        );
      };
      document.title = selectedUser.username;

      fetchHistory();
    }
    const handleTyping = ({
      userId,
      username,
    }: {
      userId: string;
      username: string;
    }) => {
      if (selectedUser?.id === userId) {
        setTypingUserName(username);
        setTimeout(() => {
          const el = document.querySelector("#chat-end");
          el?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    };

    const handleStopTyping = ({ userId }: { userId: string }) => {
      if (selectedUser?.id === userId) {
        setTypingUserName(null);
      }
    };

    socket.on("user-typing", handleTyping);
    socket.on("user-stop-typing", handleStopTyping);

    return () => {
      socket.off("user-typing", handleTyping);
      socket.off("user-stop-typing", handleStopTyping);
    };
  }, [selectedUser]);

  // when new message appear
  useEffect(() => {
    if (messages.length === 0) return;
    const el = document.querySelector("#chat-end");
    el?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // Scroll when typing indicator appears/disappears
  useEffect(() => {
    const el = document.querySelector("#chat-end");
    el?.scrollIntoView({ behavior: "smooth" });
  }, [usersTyping]);

  // Handle user selection
  const handleUserSelect = (selectedUserData: User) => {
    setSelectedUser(selectedUserData);
    // Clear messages when switching users
    setMessages([]);
    // Clear typing states when switching users
    setUsersTyping({});
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    if (!selectedUser || !user) return;

    // Start typing indicator
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        userId: user.id,
        username: user.username,
        toUserId: selectedUser.id,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stop-typing", {
        userId: user.id,
        toUserId: selectedUser.id,
      });
    }, 1500); // Stop typing indicator after 1.5 seconds of inactivity

    // If input is empty, immediately stop typing
    if (value.length === 0) {
      setIsTyping(false);
      socket.emit("stop-typing", {
        userId: user.id,
        toUserId: selectedUser.id,
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
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

    // Stop typing when message is sent
    setIsTyping(false);
    socket.emit("stop-typing", {
      userId: user?.id,
      toUserId: selectedUser.id,
    });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setNewMessage("");
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Sidebar - User List */}
      <div
        className={`
            w-90 h-full md:w-90 bg-white border-r flex flex-col
            ${selectedUser && isMobile ? "hidden" : "block"}
          `}
      >
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
            {users?.map((userItem) => {
              const hasNew = newMessageUserIds.includes(userItem.id);
              const lastMsg = lastMessages[userItem.id] || "No message yet.";

              return (
                <div
                  key={userItem.id}
                  onClick={() => {
                    handleUserSelect(userItem);
                    clearNewMessageForUser(userItem.id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === userItem.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage
                        src={userItem.avatar || "/images/user-placeholder.jpg"}
                      />
                      <AvatarFallback>
                        {userItem.username.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {userItem.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium truncate">
                          {userItem.username}
                        </h3>
                        <p className="text-xs text-gray-400">{lastMsg}</p>
                      </div>
                      <div className="">
                      {hasNew && (
                        <Badge variant="destructive" className="text-xs">
                          Mới
                        </Badge>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Current User Info */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <Link href="/profile">
              <Avatar>
                <AvatarImage
                  src={user?.avatar || "/images/user-placeholder.jpg"}
                />
                <AvatarFallback>
                  {user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link href="/profile">
                <h4 className="font-medium">{user?.username}</h4>
              </Link>
              <p className="text-sm text-green-600">Online</p>
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
      <div
        className={`
          flex-1 flex flex-col bg-white
          ${!selectedUser && isMobile ? "hidden" : "flex"}
        `}
      >
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={selectedUser?.avatar || "/images/user-placeholder.jpg"}
                  />
                  <AvatarFallback>
                    {selectedUser?.username.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedUser?.username}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedUser.isOnline
                      ? "Đang hoạt động"
                      : "Không hoạt động"}
                  </p>
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
            <ScrollArea className={`flex-1 p-4 ${isMobile ? "mt-6" : ""}`}>
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
                        <AvatarImage
                          src={
                            selectedUser?.avatar ||
                            "/images/user-placeholder.jpg"
                          }
                        />
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

                {typingUserName && (
                  <TypingIndicator
                    username={typingUserName}
                    avatar={selectedUser?.avatar as string}
                  />
                )}

                <div id="chat-end" />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4 sticky bottom-0 bg-white z-10">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder={`Nhập tin nhắn gửi ${selectedUser?.username}...`}
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
