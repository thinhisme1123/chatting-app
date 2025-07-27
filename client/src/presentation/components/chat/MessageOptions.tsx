"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit3, Reply, Copy } from "lucide-react"

interface MessageOptionsProps {
  messageId: string
  messageContent: string
  senderName: string
  isOwn: boolean
  onEdit: (messageId: string, content: string) => void
  onReply: (messageId: string, senderName: string,content: string) => void
  onCopy: (messageId: string, content: string) => void
}

export const MessageOptions: React.FC<MessageOptionsProps> = ({
  messageId,
  senderName,
  messageContent,
  isOwn,
  onEdit,
  onReply,
  onCopy,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleEdit = () => {
    onEdit(messageId, messageContent)
    setIsOpen(false)
  }

  const handleReply = () => {
    onReply(messageId,senderName, messageContent)
    setIsOpen(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent)
      onCopy(messageId, messageContent)
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-200"
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {isOwn && (
          <DropdownMenuItem onClick={handleEdit} className="flex items-center gap-2 cursor-pointer">
            <Edit3 className="h-4 w-4" />
            <span>Chỉnh sửa</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleReply} className="flex items-center gap-2 cursor-pointer">
          <Reply className="h-4 w-4" />
          <span>Trả lời</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy} className="flex items-center gap-2 cursor-pointer">
          <Copy className="h-4 w-4" />
          <span>Sao chép</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
