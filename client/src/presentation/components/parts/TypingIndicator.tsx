// src/components/chat/TypingIndicator.tsx
"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  username: string;
}

export const TypingIndicator = ({ username }: TypingIndicatorProps) => (
  <div className="flex gap-3">
    <Avatar className="w-8 h-8">
      <AvatarImage src="/placeholder.svg" />
      <AvatarFallback>{username.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col items-start">
      <div className="bg-gray-100 px-4 py-2 rounded-2xl flex items-center gap-2">
        <div className="flex gap-1">
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
        <span className="text-sm text-gray-600">{username} đang nhập...</span>
      </div>
    </div>
  </div>
);
