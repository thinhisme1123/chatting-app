import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatRoomUseCase } from "@/src/application/usecases/chat-room-use-cases.query";
import { ChatUseCases } from "@/src/application/usecases/chat-use-cases.query";
import { FriendUseCases } from "@/src/application/usecases/friend-user-cases.query";
import { ChatRoom } from "@/src/domain/entities/ChatRoom";
import { LastMessageInfo } from "@/src/domain/entities/LastMessageInfo";
import { Message } from "@/src/domain/entities/Message";
import {
  AppNotification,
  FriendRequestNotification,
} from "@/src/domain/entities/Notification";
import { User } from "@/src/domain/entities/User";
import { ChatRoomRepository } from "@/src/infrastructure/repositories/chat-room.repository";
import { ChatRepository } from "@/src/infrastructure/repositories/chat.repository";
import { FriendRepository } from "@/src/infrastructure/repositories/friend.repository";
import { playNotificationSound } from "@/src/utils/playNotificationSound";
import { truncate } from "@/src/utils/truncateText";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import {
  ArrowLeft,
  LogOut,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { NotificationBar } from "../components/chat/NotificationBar";
import { AddFriendModal } from "../components/modals/AddFriendModal";
import { CreateGroupModal } from "../components/modals/CreateGroupModal";
import { TypingIndicator } from "../components/parts/TypingIndicator";
import { useAuth } from "../contexts/AuthContext";

type ChatTarget = User | ChatRoom;

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | ChatRoom | null>(
    null
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const chatUseCases = new ChatUseCases(new ChatRepository());
  const friendUseCases = new FriendUseCases(new FriendRepository());
  const chatRoomUseCases = new ChatRoomUseCase(new ChatRoomRepository());

  const [isMobile, setIsMobile] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [notification, setNotifications] = useState<AppNotification[]>([]);

  // Typing indicator states
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [usersTyping, setUsersTyping] = useState<{ [key: string]: string }>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [newMessageUserIds, setNewMessageUserIds] = useState<string[]>([]);
  const [lastMessages, setLastMessages] = useState<
    Record<string, LastMessageInfo>
  >({});

  const [showCreateModal, setIsCreateGroupModalOpen] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  const allChats = [...users, ...chatRooms];

  const filteredChats = searchQuery.trim()
    ? allChats.filter((item) => {
        const name = "username" in item ? item.username : item.name;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : allChats;

  const displayedUsers = filteredChats.slice().sort((a, b) => {
    const aTime = new Date(lastMessages[a.id]?.timestamp || 0).getTime();
    const bTime = new Date(lastMessages[b.id]?.timestamp || 0).getTime();
    return bTime - aTime;
  });

  // Check if we're in browser environment
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const setUserHasNewMessage = (id: string) => {
    setNewMessageUserIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const clearNewMessageForUser = (id: string) => {
    setNewMessageUserIds((prev) => prev.filter((uid) => uid !== id));
  };

  const updateLastMessageForUser = async (friendId: string) => {
    if (!user?.id) return;
    try {
      const message = await chatUseCases.getLastMessage(user.id, friendId);
      if (message) {
        setLastMessages((prev) => ({
          ...prev,
          [friendId]: {
            content: message.content || "No messages yet.",
            timestamp: message.timestamp.toString(),
          },
        }));
      }
    } catch (err) {
      console.error("Error updating last message:", err);
    }
  };

  // Socket initialization
  useEffect(() => {
    if (!isClient) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) {
      setError("API URL is not configured");
      return;
    }

    try {
      const newSocket = io(API_URL);

      newSocket.on("connect", () => {
        setSocket(newSocket);
      });

      newSocket.on("online-users", (userIds: string[]) => {
        setOnlineUserIds(userIds);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setError("Failed to connect to chat server");
      });

      return () => {
        newSocket.disconnect();
        newSocket.off("online-users");
      };
    } catch (error) {
      console.error("Socket initialization error:", error);
      setError("Failed to initialize chat connection");
    }
  }, [isClient]);

  // handle user online or not
  const selectedUserWithStatus = useMemo(() => {
    if (!selectedUser) return null;
    return {
      ...selectedUser,
      isOnline: onlineUserIds.includes(selectedUser.id),
    };
  }, [selectedUser, onlineUserIds]);

  //fetch friends and group
  const fetchUsers = useCallback(async () => {
    try {
      if (!user?.id) return;

      const data = await friendUseCases.getConfirmedFriends(user.id);
      const rooms = await chatRoomUseCases.getRoomsForUser(user.id);
      setChatRooms(rooms);
      setUsers(data);
      setFriends(data);

      if (Array.isArray(data) && data.length > 0 && !selectedUser) {
        clearNewMessageForUser(data[0].id);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
      setIsLoading(false);
    }
  }, [user?.id, selectedUser]);

  // Initial setup
  useEffect(() => {
    if (!isClient) return;
    // Request notification permission with error handling
    const requestNotificationPermission = async () => {
      if ("Notification" in window && Notification.permission !== "granted") {
        try {
          await Notification.requestPermission();
        } catch (error) {
          console.error("Notification permission error:", error);
        }
      }
    };

    // Mobile detection
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 768);
      }
    };

    fetchUsers();
    requestNotificationPermission();
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isClient, fetchUsers]);

  // Fetch last messages
  useEffect(() => {
    const fetchAllLastMessages = async () => {
      if (!users || !user?.id) return;

      const newMessagesMap: Record<
        string,
        { content: string; timestamp: string }
      > = {};

      for (const userItem of users) {
        try {
          const message = await chatUseCases.getLastMessage(
            user.id,
            userItem.id
          );

          newMessagesMap[userItem.id] = {
            content: message?.content || "No messages yet.",
            timestamp: message?.timestamp
              ? new Date(message.timestamp).toISOString()
              : new Date().toISOString(), // fallback to now
          };
        } catch (err) {
          console.error(`Error fetching last message for ${userItem.id}`, err);
          newMessagesMap[userItem.id] = {
            content: "Error loading message",
            timestamp: new Date().toISOString(),
          };
        }
      }

      setLastMessages(newMessagesMap);
    };

    fetchAllLastMessages();
  }, [users, user]);

  // Socket event handlers
  useEffect(() => {
    if (!user || !socket || !selectedUser) return;

    // Gửi userId để register socket room
    socket.emit("register-user", user.id);

    // Nhận tin nhắn realtime
    const handleReceiveMessage = (data: any) => {
      const isOwn = data.fromUserId === user?.id;
    
      const message = {
        ...data,
        isOwn,
      };
      console.log(message);
      

      const isGroupMessage = !!data.roomId;

      // 👥 Tin nhắn nhóm
      if (isGroupMessage) {
        const isInCurrentGroup = selectedUser?.id === data.roomId;

        if (isInCurrentGroup) {
          setMessages((prev) => [...prev, message]);
          updateLastMessageForUser(data.roomId);
        } else {
          setUserHasNewMessage(data.roomId);
          updateLastMessageForUser(data.roomId);

          try {
            playNotificationSound();
          } catch (err) {
            console.error("🔇 Sound error:", err);
          }

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            document.visibilityState !== "visible"
          ) {
            new Notification(`Tin nhắn mới từ nhóm ${data.senderName}`, {
              body: message.content,
              icon: "/images/chat-icon-2.png",
            });
          }
        }

        return;
      }

      // 👤 Tin nhắn cá nhân
      setNotifications((prev) => [
        {
          id: data._id || data.messageId,
          sender: {
            id: data.fromUserId,
            username: data.senderName,
            avatar: data.senderAvatar || "",
          },
          content: data.content,
          createdAt: data.timestamp || new Date().toISOString(),
          read: false,
          type: "new-message",
        },
        ...prev,
      ]);

      const isUserInConversation =
        selectedUser?.id === data.fromUserId ||
        selectedUser?.id === data.toUserId;

      if (isUserInConversation) {
        setMessages((prev) => [...prev, message]);
        updateLastMessageForUser(data.fromUserId);
      } else {
        setUserHasNewMessage(data.fromUserId);
        updateLastMessageForUser(data.fromUserId);

        try {
          playNotificationSound();
        } catch (error) {
          console.error("🔇 Sound error:", error);
        }

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.visibilityState !== "visible"
        ) {
          new Notification(`${data.senderName} đã nhắn tin cho bạn`, {
            body: message.content,
            icon: "/images/chat-icon-2.png",
          });
        }
      }
    };

    // Kiểm tra xem đây có phải là nhóm không
    const isGroup = "members" in selectedUser;

    if (isGroup && selectedUser) {
      socket.emit("join-room", { roomId: selectedUser.id });
      console.log("Joined room", selectedUser.id);
    }

    // Nhận lời mời kết bạn realtime
    const handleNewFriendRequest = (
      newNotification: FriendRequestNotification
    ) => {
      setNotifications((prev) => [
        { ...newNotification, type: "friend-request" },
        ...prev,
      ]);
    };

    // hiển thị bạn mới vừa kết bạn real time
    const handleFriendAccepted = (data: { newFriend: User }) => {
      setUsers((prev) => [data.newFriend, ...prev]);
      setFriends((prev) => [data.newFriend, ...prev]);
      updateLastMessageForUser(data.newFriend.id);
      fetchUsers();
    };

    // hàm xử lí khi có group mới được tạo
    const handleGroupCreated = (data: any) => {
      console.log(data);
    };

    // Lắng nghe các sự kiện từ server
    socket.on("receive-message", handleReceiveMessage);
    socket.on("friend-request-notification", handleNewFriendRequest);
    socket.on("friend-request-accepted", handleFriendAccepted);
    socket.on("new-group-notification", handleGroupCreated);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("friend-request-notification", handleNewFriendRequest);
      socket.off("friend-request-accepted", handleFriendAccepted);
      socket.off("new-group-notification", handleGroupCreated);
    };
  }, [user, selectedUser, socket]);

  // Chat history and typing handlers
  useEffect(() => {
    if (!selectedUser || !user || !socket) return;

    //fetching message history
    const fetchHistory = async () => {
      try {
        const data = await chatUseCases.getHistoryMessages(
          user.id,
          selectedUser.id
        );
        setMessages(
          data.map((msg: Message) => ({
            ...msg,
            isOwn: msg.fromUserId === user.id,
          }))
        );
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    if (typeof document !== "undefined") {
      if ("username" in selectedUser) {
        document.title = selectedUser.username;
      } else {
        document.title = selectedUser.name;
      }
    }

    fetchHistory();

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
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
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
  }, [selectedUser, user, socket]);

  // Auto-scroll effects
  useEffect(() => {
    if (messages.length === 0) return;
    const el = document.querySelector("#chat-end");
    if (el) {
      el.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  //handle search friends
  useEffect(() => {
    const el = document.querySelector("#chat-end");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, [usersTyping]);

  useEffect(() => {
    if (!user) return;

    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim() === "") {
        setFilteredUsers(users || []);
      } else {
        const result = await friendUseCases.searchConfirmedFriends(
          user.id,
          searchQuery
        );
        setFilteredUsers(result);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle user selection
  const handleUserSelect = (selected: User) => {
    setSelectedUser(selected);
    setMessages([]);
    setUsersTyping({});
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleGroupSelect = (group: ChatRoom) => {
    setSelectedUser(group);
    setMessages([]);
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

    if (!selectedUser || !user || !socket) return;

    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        userId: user.id,
        username: user.username,
        toUserId: selectedUser.id,
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stop-typing", {
        userId: user.id,
        toUserId: selectedUser.id,
      });
    }, 1500);

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
    if (!newMessage.trim() || !selectedUser || !socket || !user) return;

    const isGroup = "members" in selectedUser;

    const message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.username,
      content: newMessage,
      timestamp: new Date(),
      isOwn: true,
    };

    // Hiển thị tin nhắn ngay lập tức ở FE
    setMessages((prev) => [...prev, message]);

    // Scroll to bottom
    setTimeout(() => {
      document
        .querySelector("#chat-end")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    if (isGroup) {
      // 👥 Gửi tin nhắn group

      socket.emit("send-group-message", {
        roomId: selectedUser.id,
        content: newMessage,
        senderId: user.id,
        senderName: user.username,
        senderAvatar: user.avatar,
        timestamp: new Date(),
      });
    } else {
      // 👤 Gửi tin nhắn 1-1
      socket.emit("send-message", {
        fromUserId: user.id,
        toUserId: selectedUser.id,
        senderName: user.username,
        senderAvatar: user.avatar,
        message: newMessage,
      });

      // Emit stop typing
      socket.emit("stop-typing", {
        userId: user.id,
        toUserId: selectedUser.id,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setNewMessage("");
    updateLastMessageForUser(selectedUser.id);
  };

  // Loading state
  if (!isClient || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Sidebar - User List */}
      <div
        className={`
            min-w-80 h-full bg-white border-r flex flex-col
            ${selectedUser && isMobile ? "hidden" : "block"}
          `}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tin nhắn</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 z-10 bg-white shadow-lg rounded-md border border-gray-200"
              >
                <DropdownMenuItem
                  onClick={() => {
                    setTimeout(() => setIsAddFriendModalOpen(true), 0);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer rounded-md"
                >
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span>Gửi lời mời kết bạn</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTimeout(() => setIsCreateGroupModalOpen(true), 0);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer rounded-md"
                >
                  <Users className="h-4 w-4 text-green-600" />
                  <span>Tạo nhóm chat</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {/* Friend and Room rendering */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {displayedUsers.map((item) => {
              const isGroup = "members" in item;
              const displayName = isGroup ? item.name : item.username;
              const avatar = item.avatar || "/images/user-placeholder.jpg";
              const hasNew = newMessageUserIds.includes(item.id);
              const rawMsg =
                lastMessages[item.id]?.content || "No message yet.";
              const lastMsg = truncate(rawMsg);
              const isOnline = !isGroup && onlineUserIds.includes(item.id); // chỉ áp dụng với user

              return (
                <div
                  role="button"
                  key={item.id}
                  onClick={() => {
                    if ("members" in item) {
                      handleGroupSelect(item);
                    } else {
                      handleUserSelect(item);
                    }
                    clearNewMessageForUser(item.id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === item.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={avatar} />
                    </Avatar>

                    {/* Online dot nếu là user */}
                    {!isGroup && (
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium truncate flex items-center gap-1">
                          {displayName}
                          {isGroup && (
                            <span className="ml-1 text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">
                              Nhóm
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-400">{lastMsg}</p>
                      </div>

                      {/* New message badge */}
                      <div>
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
        <NotificationBar
          newNotfications={notification}
          onSelectUser={handleUserSelect}
          onFriendAccepted={fetchUsers}
        />
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
                </Avatar>
                {selectedUserWithStatus && (
                  <div>
                    <h3 className="font-semibold">
                      {"username" in selectedUserWithStatus
                        ? selectedUserWithStatus.username
                        : selectedUserWithStatus.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {"username" in selectedUserWithStatus
                        ? selectedUserWithStatus.isOnline
                          ? "Đang hoạt động"
                          : "Không hoạt động"
                        : "Nhóm chat"}
                    </p>
                  </div>
                )}
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
                            message.senderAvatar ||
                            selectedUser?.avatar ||
                            "/images/user-placeholder.jpg"
                          }
                        />
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
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
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
                  placeholder={`Nhập tin nhắn gửi ${
                    "username" in selectedUser
                      ? selectedUser.username
                      : selectedUser?.name || ""
                  }...`}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
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

      {/* Add Friend Modal Component */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onOpenChange={setIsAddFriendModalOpen}
        friendUseCases={friendUseCases}
        currentUserId={user?.id}
      />
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setIsCreateGroupModalOpen(false)}
        friends={friends}
        socket={socket}
      />
    </div>
  );
}
