"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FriendUseCases } from "@/src/application/usecases/friend-user-cases.query";
import { NotificationUseCases } from "@/src/application/usecases/notifcation-use-cases.query";
import { AppNotification } from "@/src/domain/entities/Notification";
import { User } from "@/src/domain/entities/User";
import { FriendRepository } from "@/src/infrastructure/repositories/friend.repository";
import { NotificationRepository } from "@/src/infrastructure/repositories/notfication.repository";
import { playNotificationSound } from "@/src/utils/playNotificationSound";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Bell, CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "../../../../styles/notification.scss";
import { useAuth } from "../../contexts/AuthContext";

interface NotificationBarProps {
  newNotfications: AppNotification[];
  onSelectUser: (user: User) => void;
  onFriendAccepted: () => void;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  newNotfications,
  onSelectUser,
  onFriendAccepted,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [triggerBell, setTriggerBell] = useState(false);
  const { user } = useAuth();
  const friendUseCases = new FriendUseCases(new FriendRepository());

  const notificationUseCases = new NotificationUseCases(
    new NotificationRepository()
  );

  useEffect(() => {
    if (newNotfications) {
      setNotifications((prev) => {
        const ids = new Set(newNotfications.map((n) => n.id));
        const merged = [
          ...newNotfications,
          ...prev.filter((n) => !ids.has(n.id)),
        ];
        return merged;
      });
    }
  }, [newNotfications]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      const friendRequestData = await notificationUseCases.getUserNotifications(
        user.id
      );
      const appNotifs: AppNotification[] = friendRequestData.map((f) => ({
        ...f,
        type: "friend-request",
      }));

      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.type !== "friend-request");
        return [...appNotifs, ...filtered];
      });
    };
    fetchNotifications();
  }, [user]);

  const prevNotificationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const prevIds = prevNotificationIdsRef.current;

    // Kiểm tra nếu có ID mới chưa từng có trước đây thì mới play
    const hasNew = notifications.some((n) => !prevIds.has(n.id));

    // Cập nhật unread count
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);

    if (hasNew) {
      playNotificationSound();
    }

    // Cập nhật ref sau khi xử lý
    prevNotificationIdsRef.current = currentIds;
  }, [notifications]);

  useEffect(() => {
    if (unreadCount > 0) {
      setTriggerBell(true);

      const timeout = setTimeout(() => {
        setTriggerBell(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [unreadCount]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return "vài giây trước";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await friendUseCases.respondToRequest(requestId, "accept");
      onFriendAccepted();
      setNotifications((prev) => prev.filter((n) => n.id !== requestId));
    } catch (error) {
      console.error("❌ Accept friend request failed:", error);
    }
  };

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative me-2 focus:outline-none focus:ring-0"
          >
            <Bell
              className={cn(
                "h-5 w-5 transition-transform",
                triggerBell && "animate-bell-ring"
              )}
            />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute left-5 top-1 h-4 w-4 flex items-center justify-center p-0 text-xs"
                style={{ right: "0px" }}
                aria-label={`${unreadCount} thông báo chưa đọc`}
              >
                {unreadCount}
              </Badge>
            )}
            <span className="sr-only">Thông báo</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-2" align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            Thông báo
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 h-auto p-1"
              >
                <CheckCircle className="h-3 w-3 mr-1" /> Đánh dấu đã đọc
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[250px]">
            {notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm">
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((notification) => {
                if (notification.type === "friend-request") {
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-2 p-2 cursor-pointer",
                        !notification.read && "bg-blue-50/50"
                      )}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        );
                      }}
                    >
                      <Avatar className="w-9 h-9 mt-1 rounded-full overflow-hidden">
                        <AvatarImage
                          src={
                            notification.fromUser.avatar || "/placeholder.svg"
                          }
                          alt={notification.fromUser.username}
                        />
                        <AvatarFallback>
                          {notification.fromUser.username
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          <span className="font-semibold">
                            {notification.fromUser.username}
                          </span>{" "}
                          đã gửi cho bạn lời mời kết bạn
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(new Date(notification.createdAt))}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptFriendRequest(notification.id);
                        }}
                      >
                        Chấp nhận
                      </Button>
                    </DropdownMenuItem>
                  );
                }

                if (notification.type === "new-message") {
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-2 p-2 cursor-pointer",
                        !notification.read && "bg-green-50/50"
                      )}
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        );
                        onSelectUser(notification.sender as User);
                      }}
                    >
                      <Avatar className="w-9 h-9 mt-1 rounded-full overflow-hidden">
                        <AvatarImage
                          src={
                            notification.sender.avatar ||
                            "/images/user-placeholder.svg"
                          }
                          alt={notification.sender.username}
                        />
                        <AvatarFallback>
                          {notification.sender.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          <span className="font-semibold">
                            {notification.sender.username}
                          </span>{" "}
                          đã gửi cho bạn tin nhắn
                        </p>
                        <span className="text-xs text-gray-500 line-clamp-1">
                          {notification.content}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                }

                if (notification.type === "acepted-friend-request") {
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-2 p-2 cursor-pointer",
                        !notification.read && "bg-green-50/50"
                      )}
                      onClick={() => {
                        // Đánh dấu đã đọc
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        );
                        // Mở đoạn chat với người vừa chấp nhận
                        onSelectUser({
                          id: notification.id,
                          username: notification.username,
                          avatar: notification.avatar,
                          isOnline: false,
                          lastSeen: notification.lastSeen,
                          createdAt: notification.createAt,
                        } as User);
                      }}
                    >
                      <Avatar className="w-9 h-9 mt-1 rounded-full overflow-hidden">
                        <AvatarImage
                          src={
                            notification.avatar ||
                            "/images/user-placeholder.svg"
                          }
                          alt={notification.username}
                        />
                        <AvatarFallback>
                          {notification.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          <span className="font-semibold">
                            {notification.username}
                          </span>{" "}
                          đã chấp nhận lời mời kết bạn của bạn
                        </p>
                      </div>
                    </DropdownMenuItem>
                  );
                }

                return null;
              })
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
