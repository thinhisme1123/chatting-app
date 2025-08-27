"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit3, Reply, Copy, Delete } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

interface MessageOptionsProps {
  messageId: string;
  messageContent: string;
  senderName: string;
  isOwn: boolean;
  imageUrl: string;
  onDelete: (messageid: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onReply: (
    messageId: string,
    senderName: string,
    content: string,
    imageUrl: string
  ) => void;
  onCopy: (messageId: string, content: string) => void;
}

export const MessageOptions: React.FC<MessageOptionsProps> = ({
  messageId,
  senderName,
  messageContent,
  imageUrl,
  isOwn,
  onDelete,
  onEdit,
  onReply,
  onCopy,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const handleEdit = () => {
    onEdit(messageId, messageContent);
    setIsOpen(false);
  };

  const handleReply = () => {
    onReply(messageId, senderName, messageContent, imageUrl);

    setTimeout(() => {
      setIsOpen(false);
    }, 50);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      onCopy(messageId, messageContent);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted"
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40"
        loop={false}
        onCloseAutoFocus={(e) => {
          e.preventDefault(); // 👈 THIS is the secret weapon
        }}
      >
        {isOwn && (
          <div>
            <DropdownMenuItem
              onClick={handleEdit}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              <span>{t("common.edit")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(messageId)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Delete className="h-4 w-4" />
              <span>{t("common.delete")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
          </div>
        )}
        
        {/* i want to have devider here */}
        <DropdownMenuItem
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleReply}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Reply className="h-4 w-4" />
          <span>{t("common.reply")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCopy}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Copy className="h-4 w-4" />
          <span>{t("common.copy")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
