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
import {
  AceptedFriendRequestNotification,
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
  ImageIcon,
  LogOut,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { MessageOptions } from "../components/chat/MessageOptions";
import { NotificationBar } from "../components/chat/NotificationBar";
import { AddFriendModal } from "../components/modals/AddFriendModal";
import { CreateGroupModal } from "../components/modals/CreateGroupModal";
import { TypingIndicator } from "../components/parts/TypingIndicator";
import { useAuth } from "../contexts/AuthContext";

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
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);

  const chatInputBoxRef = useRef<HTMLInputElement | null>(null);
  // Image handling states
  const [pastedImages, setPastedImages] = useState<
    Array<{
      id: string;
      file: File;
      preview: string;
      name: string;
      size: number;
    }>
  >([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<{
    id: string;
    senderName: string;
    content: string;
  } | null>(null);

  // search friend input box
  const [searchQuery, setSearchQuery] = useState("");

  const chatUseCases = new ChatUseCases(new ChatRepository());
  const friendUseCases = new FriendUseCases(new FriendRepository());
  const chatRoomUseCases = new ChatRoomUseCase(new ChatRoomRepository());

  const [isMobile, setIsMobile] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [notification, setNotifications] = useState<AppNotification[]>([]);

  // Typing indicator states
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [avatarGroupUserTyping, setAvatarGroupUserTyping] = useState<
    string | null
  >(null);
  const [usersTyping, setUsersTyping] = useState<{ [key: string]: string }>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // set new message come and show last message
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

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await addImageToPreview(file);
        }
      }
    }
  };

  const addImageToPreview = async (file: File) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const preview = URL.createObjectURL(file);

    const newImage = {
      id,
      file,
      preview,
      name: file.name || `image-${id}.png`,
      size: file.size,
    };

    setPastedImages((prev) => [...prev, newImage]);
  };

  const removeImage = (id: string) => {
    setPastedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        await addImageToPreview(file);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        await addImageToPreview(file);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const updateLastMessage = async (id: string, isGroup: boolean) => {
    if (!user?.id) return;

    try {
      if (isGroup) {
        const message = await chatRoomUseCases.getGroupLastMessage(id);
        if (message) {
          setLastMessages((prev) => ({
            ...prev,
            [id]: {
              content: message.content || "No messages yet.",
              timestamp: message.timestamp.toString(),
              senderName: message.senderName, // Add this if you’re using it
            },
          }));
        }
      } else {
        const message = await chatUseCases.getLastMessage(user.id, id);
        if (message) {
          setLastMessages((prev) => ({
            ...prev,
            [id]: {
              content: message.content || "No messages yet.",
              timestamp: message.timestamp.toString(),
            },
          }));
        }
      }
    } catch (err) {
      console.error("Error updating last message:", err);
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleReplyToMessage = (
    messageId: string,
    senderName: string,
    content: string
  ) => {
    //handle focus message input box
    setReplyingToMessage({ id: messageId, senderName, content });
    chatInputBoxRef.current?.focus();
  };

  useEffect(() => {
    if (!replyingToMessage || !chatInputBoxRef.current) return;

    let attempts = 0;
    const input = chatInputBoxRef.current;

    const forceFocus = () => {
      input.focus();
      if (document.activeElement !== input && attempts < 5) {
        attempts++;
        setTimeout(forceFocus, 50);
      }
    };

    forceFocus();
  }, [replyingToMessage]);

  const handleCopyMessage = (messageId: string, content: string) => {
    // You can add a toast notification here if needed
    console.log(`Message ${messageId} copied: ${content}`);
  };

  const cancelReply = () => {
    setReplyingToMessage(null);
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

      fetchLastMessages(data);
      fetchLastMessagesForRooms(rooms);

      if (Array.isArray(data) && data.length > 0 && !selectedUser) {
        clearNewMessageForUser(data[0].id);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
      setIsLoading(false);
    }
  }, [user]);

  // fetching last message
  const fetchLastMessages = async (userList: User[]) => {
    if (!user || !userList || userList.length === 0) return;

    const newMessagesMap: Record<
      string,
      { content: string; timestamp: string }
    > = {};

    for (const userItem of userList) {
      try {
        const message = await chatUseCases.getLastMessage(user.id, userItem.id);

        newMessagesMap[userItem.id] = {
          content: message?.content || "No messages yet.",
          timestamp: message?.timestamp
            ? new Date(message.timestamp).toISOString()
            : new Date().toISOString(),
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

  // fetching group last message
  const fetchLastMessagesForRooms = async (roomList: ChatRoom[]) => {
    if (!roomList || roomList.length === 0) return;
    console.log(123);

    const newMap: Record<
      string,
      { content: string; timestamp: string; senderName: string }
    > = {};

    for (const room of roomList) {
      try {
        const msg = await chatRoomUseCases.getGroupLastMessage(room.id);

        newMap[room.id] = {
          content: msg?.content || "No messages yet.",
          timestamp: msg?.timestamp
            ? new Date(msg.timestamp).toISOString()
            : new Date().toISOString(),

          senderName: msg?.senderName,
        };
      } catch (err) {
        console.error(
          `Error fetching last group message for room ${room.id}`,
          err
        );
        newMap[room.id] = {
          content: "Error loading message",
          timestamp: new Date().toISOString(),
          senderName: "Unknown",
        };
      }
    }

    setLastMessages((prev) => ({
      ...prev,
      ...newMap,
    }));
  };

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

  // Socket event handlers
  useEffect(() => {
    if (!user || !socket) return;

    socket.emit("register-user", user.id);

    // Nhận tin nhắn realtime
    const handleReceiveMessage = (data: any) => {
      const isOwn = data.fromUserId === user?.id;
      const isGroupMessage = !!data.roomId;
      if (isGroupMessage && isOwn) return;

      const message = {
        ...data,
        isOwn,
      };
      console.log(message);

      // 👥 Tin nhắn nhóm
      if (isGroupMessage) {
        const isInCurrentGroup = selectedUser?.id === data.roomId;

        if (isInCurrentGroup) {
          setMessages((prev) => [...prev, message]);
          updateLastMessage(data.roomId, true);
        } else {
          setUserHasNewMessage(data.roomId);
          updateLastMessage(data.roomId, true);
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
        updateLastMessage(data.fromUserId, false);
      } else {
        setUserHasNewMessage(data.fromUserId);
        updateLastMessage(data.fromUserId, false);
        try {
          playNotificationSound();
        } catch (error) {
          console.error("🔇 Sound error:", error);
        }

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(`${data.senderName} đã nhắn tin cho bạn`, {
            body: message.content,
            icon: message.senderAvatar || "/images/chat-icon-2.png",
          });
        }
      }
    };

    // Kiểm tra xem đây có phải là nhóm không
    if (selectedUser) {
      const isGroup = "members" in selectedUser;

      if (isGroup && selectedUser) {
        socket.emit("join-room", { roomId: selectedUser.id });
        console.log("Joined room", selectedUser.id);
      }
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
      const newFriend = data.newFriend;

      // Cập nhật danh sách bạn bè UI
      setUsers((prev) => [newFriend, ...prev]);
      setFriends((prev) => [newFriend, ...prev]);
      updateLastMessage(newFriend.id, false);

      // 🛎️ Thêm thông báo vào danh sách notification
      const notification: AceptedFriendRequestNotification & {
        type: "acepted-friend-request";
      } = {
        id: newFriend.id,

        username: newFriend.username,
        avatar: newFriend.avatar || "/images/user-placeholder.jpg",
        lastSeen: newFriend.lastSeen,
        createAt: newFriend.createdAt,
        read: false,
        type: "acepted-friend-request",
      };

      setNotifications((prev) => [notification, ...prev]);
    };

    // hàm xử lí khi có group mới được tạo
    const handleGroupCreated = (newGroup: ChatRoom) => {
      if (newGroup.members.some((member) => member.id === user.id)) {
        setChatRooms((prev) => [newGroup, ...prev]);
        toast.success(`Bạn đã được thêm vào nhóm ${newGroup.name}`);
      }
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
  }, [user?.id, selectedUser, socket]);

  // Chat history and typing handlers
  useEffect(() => {
    if (!selectedUser || !user || !socket) return;
    chatInputBoxRef.current?.focus();
    setReplyingToMessage(null);
    const isGroup = "members" in selectedUser;
    setIsLoadingMessage(true);

    const fetchHistory = async () => {
      try {
        if (isGroup) {
          // Lấy tin nhắn nhóm
          console.log("lay tin nhan nhom");

          const groupMessages = await chatRoomUseCases.getGroupMessage(
            selectedUser.id
          );
          console.log(groupMessages);

          setMessages(
            groupMessages.map((msg) => ({
              ...msg,
              isOwn: msg.fromUserId === user.id,
            }))
          );
        } else {
          // Lấy tin nhắn 1-1
          const messages = await chatUseCases.getHistoryMessages(
            user.id,
            selectedUser.id
          );
          setMessages(
            messages.map((msg) => ({
              ...msg,
              isOwn: msg.fromUserId === user.id,
            }))
          );
        }
      } catch (error) {
        console.error("❌ Error fetching chat history:", error);
      } finally {
        setIsLoadingMessage(false);
      }
    };

    // Cập nhật tiêu đề của tab
    if (typeof document !== "undefined") {
      document.title = isGroup ? selectedUser.name : selectedUser.username;
    }

    fetchHistory();

    // Gửi typing chỉ áp dụng cho 1-1
    const handleTyping = ({
      userId,
      username,
    }: {
      userId: string;
      username: string;
    }) => {
      if (!isGroup && selectedUser?.id === userId) {
        setTypingUserName(username);
        setTimeout(() => {
          document
            .querySelector("#chat-end")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    };

    // Listen for typing in group
    const handleGroupTyping = ({
      roomId,
      username,
      userId,
      avatar,
    }: {
      roomId: string;
      username: string;
      userId: string;
      avatar: string;
    }) => {
      if (selectedUser?.id === roomId && user.id !== userId) {
        setAvatarGroupUserTyping(avatar);
        setTypingUserName(username);
        setTimeout(() => {
          document
            .querySelector("#chat-end")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    };

    //handle group stop typing
    const handleGroupStopTyping = ({
      roomId,
      userId,
    }: {
      roomId: string;
      userId: string;
    }) => {
      console.log(roomId);
      console.log(userId);

      console.log(user.id);

      if (selectedUser?.id === roomId && user.id !== userId) {
        console.log("Enter send message");
        setTypingUserName(null);
        setAvatarGroupUserTyping(null);
      }
    };

    const handleStopTyping = ({ userId }: { userId: string }) => {
      if (!isGroup && selectedUser?.id === userId) {
        setTypingUserName(null);
      }
    };

    if (!isGroup) {
      socket.on("user-typing", handleTyping);
      socket.on("user-stop-typing", handleStopTyping);
    } else {
      socket.on("group-user-typing", handleGroupTyping);
      socket.on("group-user-stop-typing", handleGroupStopTyping);
    }

    return () => {
      if (!isGroup) {
        socket.off("user-typing", handleTyping);
        socket.off("user-stop-typing", handleStopTyping);
      } else {
        socket.off("group-user-typing", handleGroupTyping);
        socket.off("group-user-stop-typing", handleGroupStopTyping);
      }
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

  // handle group selection
  const handleGroupSelect = async (group: ChatRoom) => {
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

    const isGroup = "members" in selectedUser;

    // Emit typing nếu có text và chưa đánh dấu là đang typing
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);

      if (isGroup) {
        socket.emit("group-typing", {
          roomId: selectedUser.id,
          userId: user.id,
          username: user.username,
          avatar: user.avatar,
        });
      } else {
        socket.emit("typing", {
          userId: user.id,
          username: user.username,
          toUserId: selectedUser.id,
        });
      }
    }

    // Clear và reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);

      if (isGroup) {
        socket.emit("group-stop-typing", {
          roomId: selectedUser.id,
          userId: user.id,
        });
      } else {
        socket.emit("stop-typing", {
          userId: user.id,
          toUserId: selectedUser.id,
        });
      }
    }, 1500);

    // Nếu xoá hết nội dung
    if (value.length === 0) {
      setIsTyping(false);
      if (isGroup) {
        socket.emit("group-stop-typing", {
          roomId: selectedUser.id,
          userId: user.id,
        });
      } else {
        socket.emit("stop-typing", {
          userId: user.id,
          toUserId: selectedUser.id,
        });
      }

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
      replyTo: replyingToMessage || undefined,
    };

    setMessages((prev) => [...prev, message]);

    setTimeout(() => {
      document
        .querySelector("#chat-end")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    if (isGroup) {
      socket.emit("send-group-message", {
        roomId: selectedUser.id,
        content: newMessage,
        fromUserId: user.id,
        senderName: user.username,
        senderAvatar: user.avatar,
        timestamp: new Date(),
        replyTo: replyingToMessage || undefined,
      });
      socket.emit("group-stop-typing", {
        roomId: selectedUser.id,
        userId: user.id,
      });
      updateLastMessage(selectedUser.id, true);
    } else {
      socket.emit("send-message", {
        fromUserId: user.id,
        toUserId: selectedUser.id,
        senderName: user.username,
        senderAvatar: user.avatar,
        message: newMessage,
        replyTo: replyingToMessage || undefined,
      });
      socket.emit("stop-typing", {
        userId: user.id,
        toUserId: selectedUser.id,
      });
      updateLastMessage(selectedUser.id, false);
    }

    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setNewMessage("");
    setReplyingToMessage(null); // ✅ Clear reply after send
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
                  key={isGroup ? `room-${item.id}` : `user-${item.id}`}
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
                        <p className="text-xs text-gray-400">
                          {isGroup && lastMessages[item.id]?.senderName
                            ? `${lastMessages[item.id].senderName}: `
                            : ""}
                          {lastMsg}
                        </p>
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
                {isLoadingMessage ? (
                  <div className=" flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p>Đang tải tin nhắn...</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
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
                              message.senderAvatar?.trim()
                                ? message.senderAvatar // ✅ Group chat – user avatar
                                : selectedUser?.avatar?.trim()
                                ? selectedUser.avatar // ✅ 1-1 chat – other user's avatar
                                : "/images/user-placeholder.jpg"
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
                          className={`message-content flex ${
                            message.isOwn ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            {/* Reply Preview */}
                            {message.replyTo && (
                              <div
                                className={`relative max-w-xs lg:max-w-md px-3 py-2 rounded-xl bg-gray-100 shadow-sm border-l-4 ${
                                  message.isOwn
                                    ? "border-blue-500"
                                    : "border-gray-400"
                                }`}
                              >
                                <p className="text-sm font-semibold text-gray-700 leading-tight">
                                  {message.replyTo.senderName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {message.replyTo.content}
                                </p>
                              </div>
                            )}

                            {/* Actual Message Bubble */}
                            <div
                              className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow ${
                                message.isOwn
                                  ? "bg-blue-600 text-white self-end"
                                  : "bg-gray-200 text-gray-900 self-start"
                              }`}
                            >
                              <p className="text-sm leading-snug whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                          </div>

                          <MessageOptions
                            messageId={message.id}
                            messageContent={message.content}
                            senderName={message.senderName}
                            isOwn={message.isOwn}
                            onEdit={handleEditMessage}
                            onReply={handleReplyToMessage}
                            onCopy={handleCopyMessage}
                          />
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
                  ))
                )}
                {typingUserName && (
                  <TypingIndicator
                    username={typingUserName}
                    avatar={
                      selectedUser && "members" in selectedUser
                        ? avatarGroupUserTyping ||
                          "/images/user-placeholder.jpg"
                        : (selectedUser?.avatar as string)
                    }
                  />
                )}
                <div id="chat-end" />
              </div>
            </ScrollArea>

            {/* Reply Preview */}
            {replyingToMessage && (
              <div className="border-t bg-gray-50 p-3">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-12 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600">
                        Đang trả lời {replyingToMessage.senderName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {replyingToMessage.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelReply}
                    className="h-6 w-6 p-0 hover:bg-gray-200 rounded-full flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 p-2">
              <div
                className={`flex-1 relative ${
                  isDragOver ? "ring-2 ring-blue-500 ring-opacity-50" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Input
                  ref={chatInputBoxRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  placeholder={
                    replyingToMessage
                      ? `Trả lời ${replyingToMessage.senderName}...`
                      : `Nhập tin nhắn gửi ${
                          "username" in selectedUser
                            ? selectedUser.username
                            : selectedUser?.name || ""
                        }...`
                  }
                  className="pr-10"
                />

                {/* File Input Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                >
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </Button>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Drag Overlay */}
                {isDragOver && (
                  <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-300 rounded-md flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-blue-600 font-medium">
                        Thả hình ảnh vào đây
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() && pastedImages.length === 0}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
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
