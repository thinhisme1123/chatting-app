"use client";

import type React from "react";
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

interface NotificationItem {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Fake data for notifications
const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    message: "Nguyễn Văn A đã gửi cho bạn một tin nhắn mới.",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    read: false,
  },
  {
    id: "2",
    message: "Lê Thị B đã chấp nhận lời mời kết bạn của bạn.",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    read: false,
  },
  {
    id: "3",
    message: "Bạn có 3 tin nhắn chưa đọc trong nhóm 'Dự án ABC'.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: true,
  },
  {
    id: "4",
    message: "Hệ thống: Đã có b��n cập nhật mới cho ứng dụng.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    read: false,
  },
  {
    id: "5",
    message: "Trần Văn C đã gửi cho bạn một hình ảnh.",
    timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000), // 1.5 days ago
    read: true,
  },
];

export const NotificationBar: React.FC = () => {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return "vài giây trước";
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
                    "flex flex-col items-start space-y-1 p-2 cursor-pointer",
                    !notification.read && "bg-blue-50/50"
                  )}
                  onClick={() => {
                    // Optionally mark individual notification as read
                    setNotifications((prev) =>
                      prev.map((n) =>
                        n.id === notification.id ? { ...n, read: true } : n
                      )
                    );
                    // Add navigation logic here if needed
                  }}
                >
                  <p className="text-sm font-medium">{notification.message}</p>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
