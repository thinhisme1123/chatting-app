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
import { useLanguage } from "../../contexts/LanguageContext";

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
  const {t} = useLanguage();
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
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] p-0 overflow-hidden bg-gradient-to-br from-background via-background/95 to-background/90 dark:from-gray-900 dark:via-gray-800/95 dark:to-gray-900/90 border-0 shadow-2xl dark:shadow-gray-900/50 [&>button]:hidden">
        {/* Animated Background Elements - Enhanced for Dark Mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-pink-400/30 to-purple-500/30 dark:from-pink-400/40 dark:to-purple-500/40 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-400/30 to-cyan-500/30 dark:from-blue-400/40 dark:to-cyan-500/40 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 left-1/4 w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 dark:from-yellow-400/40 dark:to-orange-500/40 rounded-full animate-bounce delay-500"></div>
          <div className="absolute bottom-1/3 right-1/4 w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400/30 to-emerald-500/30 dark:from-green-400/40 dark:to-emerald-500/40 rounded-full animate-pulse delay-700"></div>

          {/* Additional Dark Mode Sparkles */}
          <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping delay-300 dark:opacity-80"></div>
          <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse delay-700 dark:opacity-80"></div>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 text-center relative">
            {/* Custom Close Button - Enhanced for Dark Mode */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 shadow-lg border border-gray-200/50 dark:border-gray-600/50"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white" />
            </button>

            {/* Animated Header Icon */}
            <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div
                className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r ${currentTheme.gradient} shadow-xl transition-all duration-500 ring-2 ring-white/20 dark:ring-gray-700/50`}
              >
                <UserPlus className="h-5 w-5 sm:h-7 sm:w-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex gap-1">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-yellow-400 animate-pulse drop-shadow-sm" />
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500 dark:text-pink-400 animate-bounce delay-200 drop-shadow-sm" />
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 dark:text-blue-400 animate-pulse delay-400 drop-shadow-sm" />
              </div>
            </div>

            <DialogTitle className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 via-purple-600 to-pink-600 dark:from-gray-100 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2 text-center drop-shadow-sm">
              {t("addFriendModal.addNewFriend")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base px-2 sm:px-0 text-center">
              {t("addFriendModal.subTitle")} 🚀
            </DialogDescription>
          </DialogHeader>

          <div className="search-container">
            {/* Enhanced Search Input */}
            <div className="relative group m-2">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-purple-600/20 dark:from-pink-400/30 dark:to-purple-600/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                <Input
                  id="search"
                  placeholder={`${t("addFriendModal.placeholderInputSearchbox")}...`}
                  className="pl-10 sm:pl-12 pr-10 sm:pr-4 h-12 sm:h-14 text-base sm:text-lg border-2 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm transition-all duration-200 group-hover:shadow-lg dark:text-white dark:placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setSearchResults([])
                    }}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Results Area - Enhanced for Dark Mode */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg dark:shadow-gray-900/30 overflow-hidden mx-2">
              <ScrollArea className="h-[280px] sm:h-[320px]">
                <div className="">
                  {isSearching ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400 animate-in fade-in duration-300">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 dark:text-blue-400" />
                        <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400/20 dark:bg-blue-400/30"></div>
                      </div>
                      <p className="mt-4 text-lg font-medium">{t("common.searching")}...</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">{t("addFriendModal.pleaseWaiting")} ✨</p>
                    </div>
                  ) : searchQuery.trim() === "" ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400 animate-in fade-in duration-300">
                      <div className="relative mb-4">
                        <div
                          className={`p-6 rounded-3xl bg-gradient-to-r ${currentTheme.gradient} shadow-xl ring-2 ring-white/20 dark:ring-gray-700/50`}
                        >
                          <Search className="h-12 w-12 text-white drop-shadow-sm" />
                        </div>
                        <div className="absolute -top-2 -right-2 text-2xl animate-bounce drop-shadow-sm">
                          {currentTheme.icon}
                        </div>
                      </div>
                      <p className="text-lg font-medium mb-2 dark:text-gray-300">
                        {t("addFriendModal.startSearchFriend")}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-xs">
                        {t("addFriendModal.subSearchFriend")}
                      </p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400 animate-in fade-in duration-300">
                      <div className="relative mb-4">
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-600 dark:to-gray-800 shadow-xl ring-2 ring-white/20 dark:ring-gray-700/50">
                          <UserX className="h-12 w-12 text-white drop-shadow-sm" />
                        </div>
                        <div className="absolute -top-2 -right-2 text-2xl drop-shadow-sm">😔</div>
                      </div>
                      <p className="text-lg font-medium mb-2 dark:text-gray-300">
                        {t("addFriendModal.noResultsTitle")}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center max-w-xs">
                        {t("addFriendModal.noResultsSubtitle")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in slide-in-from-bottom-5 duration-300">
                      <div className="p-4 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          {t("addFriendModal.searchResultsTitle")}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                        >
                          {searchResults.length} {t("addFriendModal.searchResultsCount")}
                        </Badge>
                      </div>

                      {searchResults.map((resultUser, index) => {
                        const isRequestSent = sentRequestIds.includes(resultUser.id)
                        const isFriend = friends.includes(resultUser.id)
                        const userTheme = friendThemes[index % friendThemes.length]

                        return (
                          <div
                            key={resultUser.id}
                            className={cn(
                              "group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 min-h-[90px]",
                              isRequestSent
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700 shadow-md"
                                : "bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700/80 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg dark:hover:shadow-gray-900/30",
                            )}
                            style={{ animationDelay: `${index * 100}ms` }}
                            onClick={() => {
                              if (!isFriend && !isRequestSent) {
                                handleAddFriendFromCard(resultUser.id)
                              }
                            }}
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 sm:border-3 border-white dark:border-gray-600 shadow-lg">
                                <AvatarImage src={resultUser.avatar || "/images/user-placeholder.jpg"} />
                                <AvatarFallback
                                  className={`bg-gradient-to-r ${userTheme.gradient} text-white text-base sm:text-lg font-bold`}
                                >
                                  {resultUser.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {resultUser.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 dark:bg-green-400 rounded-full border-2 sm:border-3 border-white dark:border-gray-800 animate-pulse shadow-sm"></div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200 truncate">
                                  {resultUser.username}
                                </p>
                                {resultUser.isOnline && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs hidden sm:inline-flex border border-green-200 dark:border-green-700"
                                  >
                                    {t("common.online")}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                                {resultUser.email}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 hidden sm:block leading-tight line-clamp-1 min-h-[16px]">
                                {isRequestSent
                                  ? t("addFriendModal.requestSentHint")
                                  : t("addFriendModal.tapToAddFriend")}
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                              <Button
                                variant={isFriend ? "secondary" : isRequestSent ? "secondary" : "default"}
                                size="sm"
                                disabled={isRequestSent || isFriend}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!isFriend && !isRequestSent) {
                                    handleAddFriendFromCard(resultUser.id)
                                  }
                                }}
                                className={cn(
                                  "transition-all duration-200 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 min-w-[80px] sm:min-w-[120px] shadow-sm",
                                  isRequestSent
                                    ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/70 cursor-not-allowed border border-green-200 dark:border-green-700"
                                    : `bg-gradient-to-r ${userTheme.gradient} hover:shadow-lg hover:scale-105 text-white border-0 shadow-md`,
                                )}
                              >
                                {isFriend ? (
                                  <>
                                    <UserCheck className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-500 dark:text-green-400" />
                                    <span className="hidden sm:inline">{t("addFriendModal.alreadyFriendsFull")}</span>
                                    <span className="sm:hidden">{t("addFriendModal.alreadyFriendsShort")}</span>
                                  </>
                                ) : isRequestSent ? (
                                  <>
                                    <CheckCircle2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">{t("addFriendModal.requestSentFull")}</span>
                                    <span className="sm:hidden">✓</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">{t("addFriendModal.addFriendFull")}</span>
                                    <span className="sm:hidden">{t("addFriendModal.addFriendShort")}</span>
                                  </>
                                )}
                              </Button>

                              {!isRequestSent && !isFriend && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                                  <Zap className="h-4 w-4 text-yellow-500 dark:text-yellow-400 animate-pulse drop-shadow-sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Fun Footer - Enhanced for Dark Mode */}
            <div className="text-center m-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <Heart className="h-4 w-4 text-pink-500 dark:text-pink-400 drop-shadow-sm" />
                {t("addFriendModal.encourageMessage")}
                <Sparkles className="h-4 w-4 text-yellow-500 dark:text-yellow-400 drop-shadow-sm" />
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
};
