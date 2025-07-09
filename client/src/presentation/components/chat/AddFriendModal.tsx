"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Loader2, UserX } from "lucide-react";
import type { User } from "../../../domain/entities/User";
import type { AuthUseCases } from "../../../application/usecases/AuthUseCases";
import { FriendUseCases } from "@/src/application/usecases/FriendUseCases";
import toast from "react-hot-toast";

interface AddFriendModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSelect: (user: User) => void;
  friendUseCases: FriendUseCases;
  currentUserId?: string;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onOpenChange,
  onUserSelect,
  friendUseCases,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSentRequests = async () => {
      try {
        const ids = await friendUseCases.getSentFriendRequestIds(currentUserId!);
        setSentRequestIds(ids);
      } catch (err) {
        console.error("Failed to fetch sent requests", err);
      }
    };

    if (isOpen) {
      fetchSentRequests();
    }
  }, [isOpen, friendUseCases]);

  // Debounced search function
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await friendUseCases.searchUsers(
            query,
            currentUserId!
          );
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500); // Debounce for 500ms
    },
    [friendUseCases, currentUserId]
  );

  const handleAddFriend = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    try {
      await friendUseCases.sendFriendRequest(currentUserId!, targetUserId);
      setSentRequestIds((prev) => [...prev, targetUserId]);

      toast.success("Gửi lời mời kết bạn thành công!", {
        duration: 4000,
        style: {
          border: "1px solid #4ade80",
          padding: "12px",
          color: "#16a34a",
        },
        iconTheme: {
          primary: "#4ade80",
          secondary: "#f0fdf4",
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Gửi lời mời thất bại!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Kết bạn mới
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            Tìm kiếm người dùng bằng tên hoặc email để bắt đầu trò chuyện.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Tìm kiếm người dùng..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="min-h-[150px] max-h-[300px] overflow-y-auto border rounded-md p-2">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p>Đang tìm kiếm...</p>
              </div>
            ) : searchQuery.trim() === "" ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Search className="h-8 w-8 mb-2" />
                <p>Vui lòng nhập tên hoặc email để tìm kiếm.</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <UserX className="h-8 w-8 mb-2" />
                <p>Không tìm thấy người dùng nào.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((resultUser) => (
                  <div
                    key={resultUser.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage
                        src={resultUser.avatar || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {resultUser.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {resultUser.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {resultUser.email}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={sentRequestIds.includes(resultUser.id)}
                      onClick={(e) => handleAddFriend(e, resultUser.id)}
                    >
                      {sentRequestIds.includes(resultUser.id)
                        ? "Đã gửi lời mời"
                        : "Kết bạn"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
