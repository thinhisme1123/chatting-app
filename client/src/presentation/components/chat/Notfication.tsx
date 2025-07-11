"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "../../contexts/AuthContext";
import { NotificationUseCases } from "@/src/application/usecases/NotificationUseCases.query";
import { NotificationRepository } from "@/src/infrastructure/repositories/NotificationRepository";
import { Notification } from "@/src/domain/entities/Notification";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { FriendUseCases } from "@/src/application/usecases/FriendUseCases.query";
import { FriendRepository } from "@/src/infrastructure/repositories/FriendRepository";

export const NotificationBar: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const friendUseCases = new FriendUseCases(new FriendRepository());

  const notificationUseCases = new NotificationUseCases(
    new NotificationRepository()
  );

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      const data = await notificationUseCases.getUserNotifications(user.id);
      setNotifications(data);
    };
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

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

      setNotifications((prev) => prev.filter((n) => n.id !== requestId));
    } catch (error) {
      console.error("❌ Accept friend request failed:", error);
    }
  };

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative me-2">
            <Bell className="h-5 w-5" />
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
              notifications.map((notification) => (
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
                      src={notification.fromUser.avatar || "/placeholder.svg"}
                      alt={notification.fromUser.username}
                    />
                    <AvatarFallback>
                      {notification.fromUser.username.charAt(0).toUpperCase()}
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
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
