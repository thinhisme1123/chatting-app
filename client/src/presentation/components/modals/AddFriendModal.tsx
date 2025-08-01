"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FriendUseCases } from "@/src/application/usecases/friend-user-cases.query";
import {
  Loader2,
  Search,
  UserX,
  UserPlus,
  Sparkles,
  Heart,
  Star,
  Zap,
  CheckCircle2,
  Users,
  X,
  UserCheck,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { User } from "../../../domain/entities/User";
import { cn } from "@/lib/utils";
import { useAuth } from "../../contexts/AuthContext";

interface AddFriendModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  friendUseCases: FriendUseCases;
  currentUserId?: string;
}

// Friend themes for visual variety
const friendThemes = [
  { gradient: "from-pink-400 via-rose-500 to-red-500", icon: "💖" },
  { gradient: "from-blue-400 via-cyan-500 to-teal-500", icon: "🌟" },
  { gradient: "from-purple-400 via-indigo-500 to-blue-500", icon: "✨" },
  { gradient: "from-green-400 via-emerald-500 to-teal-500", icon: "🌿" },
  { gradient: "from-orange-400 via-yellow-500 to-amber-500", icon: "🔥" },
];

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onOpenChange,
  friendUseCases,
  currentUserId,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [currentTheme, setCurrentTheme] = useState(friendThemes[0]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [friends, setFriends] = useState<string[]>([]);
  // Rotate theme every few seconds for fun
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setCurrentTheme(
          friendThemes[Math.floor(Math.random() * friendThemes.length)]
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchSentRequests = async () => {
      try {
        const ids = await friendUseCases.getSentFriendRequestIds(
          currentUserId!
        );
        setSentRequestIds(ids);
      } catch (err) {
        console.error("Failed to fetch sent requests", err);
      }
    };
    const fetchFriends = async () => {
      if (!user) return;
      const data = await friendUseCases.getConfirmedFriends(user.id);
      const friendIds = data.map((f) => f.id);
      setFriends(friendIds);
    };

    if (isOpen) {
      fetchSentRequests();
      fetchFriends();
    }
  }, [isOpen, friendUseCases, currentUserId]);

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
      }, 500);
    },
    [friendUseCases, currentUserId]
  );

  const handleAddFriendFromCard = async (targetUserId: string) => {
  try {
    await friendUseCases.sendFriendRequest(currentUserId!, targetUserId);
    setSentRequestIds((prev) => [...prev, targetUserId]);
    toast.success("Gửi lời mời kết bạn thành công!");
  } catch (err) {
    console.error(err);
    toast.error("Gửi lời mời thất bại!");
  }
};

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSentRequestIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] p-0 overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 [&>button]:hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 left-1/4 w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full animate-bounce delay-500"></div>
          <div className="absolute bottom-1/3 right-1/4 w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 text-center relative">
            {/* Custom Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-200 hover:scale-110 shadow-lg border border-gray-200/50"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 hover:text-gray-800" />
            </button>

            {/* Animated Header Icon */}
            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div
                className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r ${currentTheme.gradient} shadow-xl transition-all duration-500`}
              >
                <UserPlus className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="flex gap-1">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 animate-pulse" />
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500 animate-bounce delay-200" />
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 animate-pulse delay-400" />
              </div>
            </div>

            <DialogTitle className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 text-center">
              Kết bạn mới
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm sm:text-base px-2 sm:px-0 text-center">
              Tìm kiếm và kết nối với những người bạn mới thú vị! 🚀
            </DialogDescription>
          </DialogHeader>

          <div className="search-container">
            {/* Enhanced Search Input */}
            <div className="relative group m-2">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  id="search"
                  placeholder="Nhập tên hoặc email..."
                  className="sm:pr-4 h-12 sm:h-14 text-base sm:text-lg border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-200 group-hover:shadow-lg"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Area */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden mx-2">
              <ScrollArea className="h-[280px] sm:h-[320px]">
                <div className="">
                  {isSearching ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 animate-in fade-in duration-300">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                        <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400/20"></div>
                      </div>
                      <p className="mt-4 text-lg font-medium">
                        Đang tìm kiếm...
                      </p>
                      <p className="text-sm text-gray-400">
                        Chờ một chút nhé! ✨
                      </p>
                    </div>
                  ) : searchQuery.trim() === "" ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 animate-in fade-in duration-300">
                      <div className="relative mb-4">
                        <div
                          className={`p-6 rounded-3xl bg-gradient-to-r ${currentTheme.gradient} shadow-xl`}
                        >
                          <Search className="h-12 w-12 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
                          {currentTheme.icon}
                        </div>
                      </div>
                      <p className="text-lg font-medium mb-2">
                        Bắt đầu tìm kiếm bạn bè!
                      </p>
                      <p className="text-sm text-gray-400 text-center max-w-xs">
                        Nhập tên hoặc email để khám phá những người bạn mới thú
                        vị
                      </p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 animate-in fade-in duration-300">
                      <div className="relative mb-4">
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-400 to-gray-600 shadow-xl">
                          <UserX className="h-12 w-12 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 text-2xl">
                          😔
                        </div>
                      </div>
                      <p className="text-lg font-medium mb-2">
                        Không tìm thấy kết quả
                      </p>
                      <p className="text-sm text-gray-400 text-center max-w-xs">
                        Thử tìm kiếm với từ khóa khác nhé!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in slide-in-from-bottom-5 duration-300">
                      <div className="p-4 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          Kết quả tìm kiếm
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-700"
                        >
                          {searchResults.length} người dùng
                        </Badge>
                      </div>

                      {searchResults.map((resultUser, index) => {
                        const isRequestSent = sentRequestIds.includes(
                          resultUser.id
                        );
                        const isFriend = friends.includes(resultUser.id);
                        const userTheme =
                          friendThemes[index % friendThemes.length];

                        return (
                          <div
                            key={resultUser.id}
                            className={cn(
                              "group flex items-center gap-3 sm:gap-4 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 min-h-[90px]",
                              isRequestSent
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md"
                                : "bg-white/80 hover:bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg"
                            )}
                            style={{ animationDelay: `${index * 100}ms` }}
                            onClick={() => {
                              if (!isFriend && !isRequestSent) {
                                handleAddFriendFromCard(resultUser.id); 
                              }
                            }}
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 sm:border-3 border-white shadow-lg">
                                <AvatarImage
                                  src={resultUser.avatar || "/images/user-placeholder.jpg"}
                                />
                                <AvatarFallback
                                  className={`bg-gradient-to-r ${userTheme.gradient} text-white text-base sm:text-lg font-bold`}
                                >
                                  {resultUser.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {resultUser.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 sm:border-3 border-white animate-pulse"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm sm:text-base text-gray-800 truncate">
                                  {resultUser.username}
                                </p>
                                {resultUser.isOnline && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700 text-xs hidden sm:inline-flex"
                                  >
                                    Online
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {resultUser.email}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 hidden sm:block leading-tight line-clamp-1 min-h-[16px]">
                                {isRequestSent
                                  ? "Đã gửi lời mời kết bạn"
                                  : "Nhấn để kết bạn"}
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                              <Button
                                variant={
                                  isFriend
                                    ? "secondary"
                                    : isRequestSent
                                    ? "secondary"
                                    : "default"
                                }
                                size="sm"
                                disabled={isRequestSent || isFriend}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isFriend && !isRequestSent) {
                                    handleAddFriendFromCard(resultUser.id);
                                  }
                                }}
                                className={cn(
                                  "transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 min-w-[80px] sm:min-w-[120px]",
                                  isRequestSent
                                    ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-not-allowed"
                                    : `bg-gradient-to-r ${userTheme.gradient} hover:shadow-lg hover:scale-105 text-white border-0`
                                )}
                              >
                                {isFriend ? (
                                  <>
                                    <UserCheck className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                    <span className="hidden sm:inline">
                                      Đã là bạn bè
                                    </span>
                                    <span className="sm:hidden">Bạn</span>
                                  </>
                                ) : isRequestSent ? (
                                  <>
                                    <CheckCircle2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">
                                      Đã gửi
                                    </span>
                                    <span className="sm:hidden">✓</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">
                                      Kết bạn
                                    </span>
                                    <span className="sm:hidden">Add</span>
                                  </>
                                )}
                              </Button>

                              {!isRequestSent && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                                  <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Fun Footer */}
            <div className="text-center m-2">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                Hãy kết bạn và chia sẻ những khoảnh khắc tuyệt vời!
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
