import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuthUseCases } from "@/src/application/usecases/auth-use-cases.query";
import { ChatRoomUseCase } from "@/src/application/usecases/chat-room-use-cases.query";
import { ChatUseCases } from "@/src/application/usecases/chat-use-cases.query";
import { FriendUseCases } from "@/src/application/usecases/friend-user-cases.query";
import { ChatRoom } from "@/src/domain/entities/ChatRoom";
import { GroupMessage } from "@/src/domain/entities/GroupMessage";
import { LastMessageInfo } from "@/src/domain/entities/LastMessageInfor";
import { Message } from "@/src/domain/entities/Message";
import {
  AceptedFriendRequestNotification,
  AppNotification,
  FriendRequestNotification,
} from "@/src/domain/entities/Notifications";
import { User } from "@/src/domain/entities/User";
import { useWebRTC } from "@/src/hooks/useWebRTC";
import { AuthRepository } from "@/src/infrastructure/repositories/auth.repository";
import { ChatRoomRepository } from "@/src/infrastructure/repositories/chat-room.repository";
import { ChatRepository } from "@/src/infrastructure/repositories/chat.repository";
import { FriendRepository } from "@/src/infrastructure/repositories/friend.repository";
import { callSocket } from "@/src/sockets/callSocket";
import { playNotificationSound } from "@/src/utils/playNotificationSound";
import { playRingingCall } from "@/src/utils/playRingingCall";
import { truncate } from "@/src/utils/truncateText";
import { AvatarFallback } from "@radix-ui/react-avatar";
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
import { Socket } from "socket.io-client";
import { socket as globalSocket } from "../../sockets/baseSocket";
import { ActiveCallModal } from "../components/call/ActiveCallModal";
import { IncomingCallModal } from "../components/call/IncomingCallModal";
import { OutgoingCallModal } from "../components/call/OutgoingCallModal";
import { MessageOptions } from "../components/chat/MessageOptions";
import { NotificationBar } from "../components/chat/NotificationBar";
import { AddFriendModal } from "../components/modals/AddFriendModal";
import { CreateGroupModal } from "../components/modals/CreateGroupModal";
import { LanguageSelector } from "../components/parts/LanguageSelector";
import ScrollToBottomButton from "../components/parts/ScrollToBottomButton";
import { ThemeToggle } from "../components/parts/ThemeToggle";
import { TypingIndicator } from "../components/parts/TypingIndicator";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { ProgressToast } from "../components/parts/ProgressToast";
import { decodeMessage } from "@/src/utils/decode-message";
import { ReactionBar } from "../components/parts/ReactionBar";
import { MessageItem } from "../components/parts/MessageItem";

export default function ChatPage() {
  const { t } = useLanguage();
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
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const [replyingToMessage, setReplyingToMessage] = useState<{
    id: string;
    senderName: string;
    content: string;
    imageUrl: string;
  } | null>(null);

  // search friend input box
  const [searchQuery, setSearchQuery] = useState("");

  const chatUseCases = new ChatUseCases(new ChatRepository());
  const friendUseCases = new FriendUseCases(new FriendRepository());
  const chatRoomUseCases = new ChatRoomUseCase(new ChatRoomRepository());
  const authUseCases = new AuthUseCases(new AuthRepository());

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

  // handle scroll to the bottom when scoll in messages area
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  // calling section variables
  const [isOutgoingModalOpen, setOutgoingModalOpen] = useState(false);
  const [isActiveCallModalOpen, setActiveCallModalOpen] = useState(false);
  const [role, setRole] = useState<"caller" | "callee" | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<"ringing" | "rejected">(
    "ringing"
  );
  const { localStream, startCall, initPeer, peerRef } = useWebRTC({
    fromUser: user as User,
    localUserId: user?.id as string,
    remoteUserId: selectedUser?.id as string,
    onRemoteStream: (stream: MediaStream) => {
      setRemoteStream(stream);
    },
    role: role ?? "caller", // fallback but better to always set
  });

  const [incomingCall, setIncomingCall] = useState<{
    from: User;
    offer: RTCSessionDescriptionInit;
    callType: "audio" | "video";
  } | null>(null);

  // Check if we're in browser environment
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    callSocket.onIncomingCall((data: any) => {
      setRole("callee");
      setIncomingCall(data);
      playRingingCall();
    });

    return () => {
      globalSocket.off("call:incoming");
      messages.forEach((msg) => {
        if (msg.imageUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(msg.imageUrl);
        }
      });
    };
  }, [messages]);

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
      console.log("Item type:", item.type);
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
              content: message.content || t("chat.noMessageYet"),
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
              content: message.content || t("chat.noMessageYet"),
              timestamp: message.timestamp.toString(),
            },
          }));
        }
      }
    } catch (err) {
      console.error("Error updating last message:", err);
    }
  };
  const handleDeleteMessage = async (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    if (selectedUser) {
      const isGroup = "members" in selectedUser;
      try {
        await chatUseCases.deleteMessage(
          messageId,
          isGroup,
          selectedUser?.id as string
        );

        toast.custom(
          () => (
            <ProgressToast
              message="Message deleted successfully"
              type="success"
            />
          ),
          { duration: 3000 }
        );
      } catch (err) {
        // Rollback if backend delete fails
        setMessages((prev) => [
          ...prev,
          messages.find((m) => m.id === messageId)!,
        ]);

        toast.custom(
          () => (
            <ProgressToast message="Failed to delete message ❌" type="error" />
          ),
          { duration: 3000 }
        );
      }
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setReplyingToMessage(null);
    setEditingMessageId(messageId);
    setEditingMessageContent(content);
    chatInputBoxRef.current?.focus();
  };

  const handleReplyToMessage = (
    messageId: string,
    senderName: string,
    content: string,
    imageUrl: string
  ) => {
    //handle focus message input box
    setEditingMessageId(null);
    setEditingMessageContent("");
    setReplyingToMessage({ id: messageId, senderName, content, imageUrl });
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

  const handleCopyMessage = (content: string) => {
    // You can add a toast notification here if needed
    console.log(`Message copied: ${content}`);
  };

  const cancelReply = () => {
    setReplyingToMessage(null);
  };

  // handle call section
  const initiateCall = (callType: "audio" | "video") => {
    if (!selectedUser?.id) return;
    setRole("caller");
    setOutgoingModalOpen(true);
    startCall(callType); // Hook handles createPeer + offer sending
  };

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    setRole("callee");

    const pc = await initPeer(incomingCall.callType);
    await pc.setRemoteDescription(
      new RTCSessionDescription(incomingCall.offer)
    );

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    callSocket.answerCall({
      to: incomingCall.from.id,
      answer,
    });

    setIncomingCall(null);
    setOutgoingModalOpen(false);
    // ✅ open active call modal for callee too
    setActiveCallModalOpen(true);
  };

  // Caller cancels before connection
  const handleCancelCall = () => {
    if (selectedUser?.id) {
      callSocket.cancelCall({ to: selectedUser.id });
    }
    setOutgoingModalOpen(false);
  };

  const handleRejectCall = () => {
    callSocket.rejectCall({ to: incomingCall?.from.id });
    setIncomingCall(null);
  };

  // Socket initialization
  useEffect(() => {
    if (!isClient) return;

    if (!globalSocket.connected) globalSocket.connect();

    try {
      globalSocket.on("connect", () => {
        setSocket(globalSocket);
      });

      globalSocket.on("online-users", (userIds: string[]) => {
        setOnlineUserIds(userIds);
      });

      globalSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setError("Failed to connect to chat server");
      });

      return () => {
        globalSocket.disconnect();
        globalSocket.off("online-users");
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

  // fetching message for group and chat 1-1
  const fetchChatHistory = async (selectedUser: User | ChatRoom) => {
    if (!selectedUser || !user) return;

    const isGroup = "members" in selectedUser;
    setIsLoadingMessage(true);

    try {
      let fetchedMessages: any[] = [];

      if (isGroup) {
        const groupMessages = await chatRoomUseCases.getGroupMessage(
          selectedUser.id
        );
        fetchedMessages = groupMessages.map((msg) => ({
          ...msg,
          isOwn: msg.fromUserId === user.id,
        }));
      } else {
        const directMessages = await chatUseCases.getHistoryMessages(
          user.id,
          selectedUser.id
        );
        fetchedMessages = directMessages.map((msg) => ({
          ...msg,
          isOwn: msg.fromUserId === user.id,
        }));
      }

      // 🔹 Fetch reactions for each message right after messages are loaded
      const messagesWithReactions = await Promise.all(
        fetchedMessages.map(async (msg) => {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/messages/${msg.id}/reactions`
            );
            if (!res.ok) return { ...msg, reactions: [] };

            const reactions = await res.json();
            return { ...msg, reactions };
          } catch (err) {
            console.error("❌ Failed to fetch reactions for msg", msg.id, err);
            return { ...msg, reactions: [] };
          }
        })
      );

      setMessages(messagesWithReactions);
    } catch (err) {
      console.error("❌ Error fetching chat history:", err);
    } finally {
      setIsLoadingMessage(false);
    }
  };

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
          content: message?.content || "",
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

    setLastMessages((prev) => ({ ...prev, ...newMessagesMap }));
  };

  // fetching group last message
  const fetchLastMessagesForRooms = async (roomList: ChatRoom[]) => {
    if (!roomList || roomList.length === 0) return;

    const newMap: Record<
      string,
      { content: string; timestamp: string; senderName: string }
    > = {};

    for (const room of roomList) {
      try {
        const msg = await chatRoomUseCases.getGroupLastMessage(room.id);

        newMap[room.id] = {
          content: msg?.content || "",
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
    setTimeout(() => {
      document
        .querySelector("#chat-end")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);
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
      console.log(data.newMessage);

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

    const handleAnswered = async (data: {
      to: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      if (data.to !== user.id) return;
      if (!peerRef.current) return;

      // Prevent running if already stable
      if (peerRef.current.signalingState !== "have-local-offer") {
        console.warn(
          "[WebRTC] Ignored duplicate answer, state:",
          peerRef.current.signalingState
        );
        return;
      }

      try {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        console.log("[WebRTC] Remote description set successfully.");
      } catch (err) {
        console.error("[WebRTC] Failed to set remote description", err);
      }
    };

    callSocket.onAnswered(handleAnswered);

    // handle call socket for rejected cal person who call
    callSocket.onRejected((data: any) => {
      if (data.from.id === selectedUser?.id) {
        setCallStatus("rejected");

        // Auto-close after 3s
        setTimeout(() => {
          setOutgoingModalOpen(false);
          setCallStatus("ringing"); // reset for next call
        }, 3000);
      }
    });

    // hanlde close incomingcallModal for user who is called
    callSocket.onCancelled((data: any) => {
      setIncomingCall(null);
    });

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
      socket.off("call:rejected");
      socket.off("call:cancelled");
      socket.off("call:answered", handleAnswered);
    };
  }, [user?.id, selectedUser, socket]);

  // Chat history and typing handlers
  useEffect(() => {
    if (!selectedUser || !user || !socket) return;

    setTypingUserName(null);
    setAvatarGroupUserTyping(null);

    chatInputBoxRef.current?.focus();
    setReplyingToMessage(null);
    setEditingMessageId(null);
    setEditingMessageContent("");
    const isGroup = "members" in selectedUser;
    setIsLoadingMessage(true);

    // Cập nhật tiêu đề của tab
    if (typeof document !== "undefined") {
      document.title = isGroup ? selectedUser.name : selectedUser.username;
    }

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

    // 👤 For 1-1 chat
    const handleSocketEditMessage = (updatedMessage: Message) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === updatedMessage.id
            ? { ...msg, content: updatedMessage.content, edited: true }
            : msg
        )
      );
    };

    // 👥 For group chat
    const handleEditGroupMessage = (updatedMessage: GroupMessage) => {
      if (
        selectedUser &&
        "members" in selectedUser &&
        selectedUser.id === updatedMessage.roomId
      ) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === updatedMessage.id
              ? { ...msg, content: updatedMessage.content, edited: true }
              : msg
          )
        );
      }
    };

    socket.on("message-edited", handleSocketEditMessage);
    socket.on("group-message-edited", handleEditGroupMessage);
    if (!isGroup) {
      socket.on("user-typing", handleTyping);
      socket.on("user-stop-typing", handleStopTyping);
    } else {
      socket.on("group-user-typing", handleGroupTyping);
      socket.on("group-user-stop-typing", handleGroupStopTyping);
    }

    return () => {
      socket.off("message-edited", handleSocketEditMessage);
      socket.off("group-message-edited", handleEditGroupMessage);
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

    if (!scrollRef.current) return;

    const viewport = scrollRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (!viewport) return;

    const handleScroll = () => {
      const isAtBottom =
        viewport.scrollHeight - viewport.scrollTop <=
        viewport.clientHeight + 10;
      setShowScrollBtn(!isAtBottom);
    };

    viewport.addEventListener("scroll", handleScroll);

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [messages]);

  //handle search friends
  useEffect(() => {
    const el = document.querySelector("#chat-end");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, [usersTyping]);

  // handle add reaction emoji
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.id, emoji }),
        }
      );

      // Optimistic UI update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: [
                  ...(msg.reactions || []).filter(
                    (r: any) => r.userId !== user?.id
                  ),
                  { userId: user?.id, emoji },
                ],
              }
            : msg
        )
      );
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  // 🔹 Function to remove reaction
  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}/reactions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });

      // Optimistic UI update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                reactions: m.reactions.filter(
                  (r: any) => !(r.userId === user?.id && r.emoji === emoji)
                ),
              }
            : m
        )
      );
    } catch (err) {
      console.error("❌ Failed to remove reaction", err);
    }
  };

  // Handle user selection
  const handleUserSelect = (selected: User) => {
    setSelectedUser(selected);
    setMessages([]);
    fetchChatHistory(selected);
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
    fetchChatHistory(group);
    setUsersTyping({});
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedUser || !user || !socket) return;
    const isGroup = "members" in selectedUser;
    const value = e.target.value;

    setNewMessage(value);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket || !user) return;

    const isGroup = "members" in selectedUser;

    if (editingMessageId) {
      if (isGroup) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editingMessageId
              ? { ...msg, content: newMessage, edited: true }
              : msg
          )
        );
        socket.emit("edit-group-message", {
          messageId: editingMessageId,
          newContent: newMessage,
          roomId: selectedUser.id,
        });
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === editingMessageId
              ? { ...msg, content: newMessage, edited: true }
              : msg
          )
        );
        socket.emit("edit-message", {
          messageId: editingMessageId,
          newContent: newMessage,
          toUserId: selectedUser.id,
        });
      }

      // Clear state after editing
      setEditingMessageId(null);
      setEditingMessageContent("");
      setNewMessage("");
      return;
    }

    // Generate temporary message ID
    const tempMessageId = `temp_${Date.now()}_${Math.random()}`;

    // Create temporary image URL if image exists
    const tempImageUrl = pastedImages[0]
      ? URL.createObjectURL(pastedImages[0].file)
      : null;

    const tempMessage = {
      id: tempMessageId, // Add temporary ID
      senderId: user.id,
      senderName: user.username,
      content: newMessage,
      timestamp: new Date(),
      imageUrl: tempImageUrl, // Use temporary URL
      isOwn: true,
      replyTo: replyingToMessage || undefined,
      uploading: !!pastedImages[0], // Flag to show loading state
    };

    // Add message to UI immediately
    setMessages((prev) => [...prev, tempMessage]);

    // Scroll to bottom immediately
    setTimeout(() => {
      document
        .querySelector("#chat-end")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    // Clear form state immediately for better UX
    const messageContent = newMessage;
    const replyMessage = replyingToMessage;
    const imageFile = pastedImages[0];

    setNewMessage("");
    setReplyingToMessage(null);
    setPastedImages([]);
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      // Upload image in background if exists
      let finalImageUrl: string = "";
      if (imageFile) {
        finalImageUrl = await authUseCases.uploadImageMessage(
          user.id,
          imageFile.file
        );

        // Update the message with real image URL
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessageId
              ? { ...msg, imageUrl: finalImageUrl, uploading: false }
              : msg
          )
        );
      }

      // Send to server with final image URL
      if (isGroup) {
        socket.emit("send-group-message", {
          roomId: selectedUser.id,
          content: messageContent,
          fromUserId: user.id,
          senderName: user.username,
          imageUrl: finalImageUrl,
          senderAvatar: user.avatar,
          timestamp: tempMessage.timestamp,
          replyTo: replyMessage || undefined,
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
          imageUrl: finalImageUrl,
          senderAvatar: user.avatar,
          message: messageContent,
          replyTo: replyMessage || undefined,
        });
        socket.emit("stop-typing", {
          userId: user.id,
          toUserId: selectedUser.id,
        });
        updateLastMessage(selectedUser.id, false);
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      // Handle error - maybe show retry option or remove the message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessageId
            ? { ...msg, uploadError: true, uploading: false }
            : msg
        )
      );
    }
  };

  // Loading state
  if (!isClient || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t("common.loading")}</p>
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
            <h2 className="text-xl font-semibold">{t("chat.messages")}</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-muted transition-colors"
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
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-muted transition-colors cursor-pointer rounded-md"
                >
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span>{t("friends.addFriend")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTimeout(() => setIsCreateGroupModalOpen(true), 0);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-muted transition-colors cursor-pointer rounded-md"
                >
                  <Users className="h-4 w-4 text-green-600" />
                  <span>{t("chat.createGroup")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("chat.searchConversations")}
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
              const encodedMsg = lastMessages[item.id]?.content;

              const rawMsg = encodedMsg
                ? decodeMessage(encodedMsg) // decode UTF-8 safe
                : t("chat.noMessageYet");

              const lastMsg = truncate(rawMsg, isGroup);
              const isOnline = !isGroup && onlineUserIds.includes(item.id);

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
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedUser?.id === item.id
                      ? "bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 shadow-sm"
                      : "hover:bg-accent dark:hover:bg-accent/80 hover:shadow-sm"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                      <AvatarImage src={avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {displayName?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Online dot nếu là user */}
                    {!isGroup && (
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm transition-colors ${
                          isOnline
                            ? "bg-green-500 dark:bg-green-400"
                            : "bg-muted-foreground/40 dark:bg-muted-foreground/30"
                        }`}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate flex items-center gap-2 text-foreground">
                          {displayName}
                          {isGroup && (
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                              {t("group.typeGroup")}
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {isGroup && lastMessages[item.id]?.senderName
                            ? `${lastMessages[item.id].senderName}: `
                            : ""}
                          {lastMsg}
                        </p>
                      </div>

                      {/* New message badge */}
                      {hasNew && (
                        <Badge
                          variant="destructive"
                          className="text-xs ml-2 bg-red-500 dark:bg-red-600 text-white border-0 shadow-sm animate-pulse"
                        >
                          {t("chat.new")}
                        </Badge>
                      )}
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
              <p className="text-sm text-green-600">{t("common.online")}</p>
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
        <div className="flex justify-end">
          <LanguageSelector />
          <ThemeToggle />
          <NotificationBar
            newNotfications={notification}
            onSelectUser={handleUserSelect}
            onFriendAccepted={fetchUsers}
          />
        </div>
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
                          ? t("common.online")
                          : t("common.offline")
                        : t("group.typeGroup")}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => initiateCall("audio")}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => initiateCall("video")}
                >
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea
              ref={scrollRef}
              className={`flex-1 p-4 ${isMobile ? "mt-6" : ""}`}
            >
              <div className="space-y-4">
                {isLoadingMessage ? (
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p>{t("chat.loadingMessages")}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      currentUser={user as User}
                      selectedUser={selectedUser}
                      onReact={handleReact}
                      onDelete={handleDeleteMessage}
                      onEdit={handleEditMessage}
                      onReply={handleReplyToMessage}
                      onCopy={handleCopyMessage}
                      onDeleteReaction={handleRemoveReaction}
                      decodeMessage={decodeMessage}
                      t={t}
                    />
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
            {showScrollBtn && <ScrollToBottomButton />}
            {/* Reply Preview */}
            {replyingToMessage && (
              <div className="border-t bg-gray-50 p-3">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-12 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-blue-600">
                        {t("chat.replyingTo")} {replyingToMessage.senderName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {decodeMessage(replyingToMessage.content)}
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

            {/* Edit Preview */}
            {editingMessageId && (
              <div className="border-t bg-yellow-50 p-3">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-12 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-yellow-600">
                        {t("chat.editingMessage")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {decodeMessage(editingMessageContent)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingMessageId(null)}
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
                {/* Input Box */}
                <div className="relative">
                  <Input
                    ref={chatInputBoxRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onPaste={handlePaste}
                    placeholder={
                      editingMessageId
                        ? `${t("chat.editingMessage")}...`
                        : replyingToMessage
                        ? `${t("common.reply")} ${
                            replyingToMessage.senderName
                          }...`
                        : `${t("chat.typeMessage")} ${
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
                </div>

                {/* Image Previews */}
                {pastedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pastedImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-20 h-20 rounded-md overflow-hidden border border-gray-300"
                      >
                        <img
                          src={img.preview}
                          alt={img.name}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPastedImages((prev) =>
                              prev.filter((i) => i.id !== img.id)
                            )
                          }
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

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
                {t("chat.selectConversation")}
              </h3>
              <p className="text-gray-500">
                {t("chat.selectConversationDesc")}
              </p>
            </div>
          </div>
        )}
      </div>
      {/* active call modal */}
      <ActiveCallModal
        open={isActiveCallModalOpen}
        onEnd={() => {
          callSocket.endCall({ to: selectedUser?.id });
          setActiveCallModalOpen(false);
        }}
        localStream={localStream}
        remoteStream={remoteStream}
        callType={incomingCall?.callType ?? "audio"}
      />
      {/* Add Friend Modal Component */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onOpenChange={setIsAddFriendModalOpen}
        friendUseCases={friendUseCases}
        currentUserId={user?.id}
      />
      {/* create group chat modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setIsCreateGroupModalOpen(false)}
        friends={friends}
        socket={socket}
      />
      {/* in comming call dialog */}
      <IncomingCallModal
        open={!!incomingCall}
        caller={incomingCall?.from ?? null}
        callType={incomingCall?.callType ?? "audio"}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
      {/* out going call modal */}
      <OutgoingCallModal
        open={isOutgoingModalOpen}
        onCancel={() => {
          console.log("cancel");

          callSocket.cancelCall({ to: selectedUser?.id, from: user?.id });
          setOutgoingModalOpen(false);
          setIncomingCall(null);
        }}
        callee={selectedUser as User}
        callType={incomingCall?.callType ?? "audio"}
        status={callStatus}
      />
    </div>
  );
}
