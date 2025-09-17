"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Camera,
  Loader2,
  Sparkles,
  Heart,
  Star,
  Zap,
  CheckCircle2,
  UserPlus,
  Palette,
  X,
} from "lucide-react";
import { ChatRoomUseCase } from "@/src/application/usecases/chat-room-use-cases.query";
import { ChatRoomRepository } from "@/src/infrastructure/repositories/chat-room.repository";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { AuthUseCases } from "@/src/application/usecases/auth-use-cases.query";
import { AuthRepository } from "@/src/infrastructure/repositories/auth.repository";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  friends: { id: string; username: string; avatar?: string }[];
  socket: any;
}

// Predefined group colors and themes
const groupThemes = [
  {
    name: "Ocean",
    gradient: "from-blue-400 via-cyan-500 to-teal-600",
    icon: "🌊",
  },
  {
    name: "Sunset",
    gradient: "from-orange-400 via-pink-500 to-purple-600",
    icon: "🌅",
  },
  {
    name: "Forest",
    gradient: "from-green-400 via-emerald-500 to-teal-600",
    icon: "🌲",
  },
  {
    name: "Galaxy",
    gradient: "from-purple-400 via-indigo-500 to-blue-600",
    icon: "🌌",
  },
  {
    name: "Fire",
    gradient: "from-red-400 via-orange-500 to-yellow-600",
    icon: "🔥",
  },
  {
    name: "Lavender",
    gradient: "from-purple-300 via-pink-400 to-rose-500",
    icon: "💜",
  },
];

export const CreateGroupModal = ({
  isOpen,
  onClose,
  friends,
  socket,
}: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(groupThemes[0]);
  const [step, setStep] = useState(1); // Multi-step form
  const chatRoomUseCase = new ChatRoomUseCase(new ChatRoomRepository());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const authUseCases = new AuthUseCases(new AuthRepository());

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName || selected.length === 0 || !user?.id) return;
    setIsLoading(true);

    try {
      // Upload group avatar nếu có chọn ảnh
      if (groupAvatar) {
        const imageUrl = await authUseCases.uploadImage(user.id, groupAvatar);

        // Tạo nhóm
        const room = await chatRoomUseCase.createRoom({
          name: groupName,
          description: groupDescription,
          creatorId: user.id,
          memberIds: selected,
          avatar: imageUrl,
          theme: selectedTheme.name,
        });
        toast.success("Tạo nhóm thành công!");

        // Gửi socket cho thành viên
        socket?.emit("group-created", {
          roomId: room.id,
          avatar: room.avatar,
          name: room.name,
          members: room.members,
        });
      }

      // Reset form
      setGroupName("");
      setGroupDescription("");
      setSelected([]);
      setPreviewImage(null);
      setGroupAvatar(null);
      setStep(1);
      onClose();
    } catch (err) {
      toast.error("Tạo nhóm thất bại!");
      console.error("Tạo nhóm lỗi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleClose = () => {
    setGroupName("");
    setGroupDescription("");
    setSelected([]);
    setStep(1);
    setSelectedTheme(groupThemes[0]);
    onClose();
  };

  const canProceedStep1 = groupName.trim().length > 0;
  const canProceedStep2 = selected.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-w-[500px] max-h-[90vh] p-0 overflow-hidden bg-gradient-to-br from-background via-background/95 to-background/90 dark:from-gray-900 dark:via-gray-800/95 dark:to-gray-900/90 border-0 shadow-2xl dark:shadow-gray-900/50 [&>button]:hidden"
        onChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
      >
        {/* Animated Background Elements - Enhanced for Dark Mode */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-400/30 to-purple-500/30 dark:from-pink-400/40 dark:to-purple-500/40 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400/30 to-cyan-500/30 dark:from-blue-400/40 dark:to-cyan-500/40 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 dark:from-yellow-400/40 dark:to-orange-500/40 rounded-full animate-bounce delay-500"></div>

          {/* Additional Dark Mode Sparkles */}
          <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping delay-300 dark:opacity-80"></div>
          <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse delay-700 dark:opacity-80"></div>
        </div>

        <div className="relative z-10">
          {/* Header with Progress - Enhanced for Dark Mode */}
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 text-center relative">
            {/* Custom Close Button - Enhanced for Dark Mode */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 shadow-lg border border-gray-200/50 dark:border-gray-600/50"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <div
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r ${selectedTheme.gradient} shadow-lg ring-2 ring-white/20 dark:ring-gray-700/50`}
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-sm" />
              </div>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-yellow-400 animate-pulse drop-shadow-sm" />
            </div>

            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent drop-shadow-sm">
              {t("createGroupModal.title")}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300 text-sm sm:text-base px-2 sm:px-0">
              {step === 1 && t("createGroupModal.step1")}
              {step === 2 && t("createGroupModal.step2")}
              {step === 3 && t("createGroupModal.step3")}
            </DialogDescription>

            {/* Progress Bar - Enhanced for Dark Mode */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 mt-3 sm:mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={cn(
                      "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-300 ring-2",
                      step >= i
                        ? `bg-gradient-to-r ${selectedTheme.gradient} text-white shadow-lg scale-110 ring-white/20 dark:ring-gray-700/50`
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 ring-gray-300/50 dark:ring-gray-600/50"
                    )}
                  >
                    {step > i ? (
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      i
                    )}
                  </div>
                  {i < 3 && (
                    <div
                      className={cn(
                        "w-6 h-0.5 sm:w-8 sm:h-1 mx-0.5 sm:mx-1 rounded-full transition-all duration-300",
                        step > i
                          ? `bg-gradient-to-r ${selectedTheme.gradient}`
                          : "bg-gray-200 dark:bg-gray-700"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Step 1: Group Info - Enhanced for Dark Mode */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6 animate-in slide-in-from-right-5 duration-300">
                {/* Group Avatar Preview */}
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="relative group">
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-r ${selectedTheme.gradient} flex items-center justify-center shadow-xl transition-transform group-hover:scale-105 ring-2 ring-white/20 dark:ring-gray-700/50`}
                    >
                      {previewImage ? (
                        <img
                          src={previewImage || "/placeholder.svg"}
                          alt="Preview"
                          className="object-cover w-full h-full rounded-xl"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl drop-shadow-sm">
                          {selectedTheme.icon}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 rounded-full w-6 h-6 sm:w-8 sm:h-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 shadow-md"
                    >
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-300" />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setGroupAvatar(file);
                          setPreviewImage(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Group Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="groupName"
                    className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400 drop-shadow-sm" />
                    Tên nhóm *
                  </Label>
                  <Input
                    id="groupName"
                    placeholder={t("createGroupModal.placeholderGroupName")}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-10 sm:h-12 text-base sm:text-lg border-2 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* Group Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="groupDescription"
                    className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <Heart className="h-4 w-4 text-pink-500 dark:text-pink-400 drop-shadow-sm" />
                    {t("createGroupModal.groupDescriptionLabel")}
                  </Label>
                  <Textarea
                    id="groupDescription"
                    placeholder={t(
                      "createGroupModal.groupDescriptionPlaceholder"
                    )}
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="min-h-[80px] sm:min-h-[100px] resize-none border-2 border-gray-200 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Member Selection - Enhanced for Dark Mode */}
            {step === 2 && (
              <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-5 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <UserPlus className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    {t("createGroupModal.chooseMembers")}
                  </Label>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs sm:text-sm border border-blue-200 dark:border-blue-700"
                  >
                    {selected.length} {t("createGroupModal.membersSelected")}
                  </Badge>
                </div>

                <ScrollArea className="h-[240px] sm:h-[280px] border-2 border-gray-200 dark:border-gray-600 rounded-xl p-2 sm:p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  {friends.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8 sm:py-12">
                      <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                      <p className="text-sm sm:text-base">
                        {t("createGroupModal.noFriends")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend, index) => {
                        const isSelected = selected.includes(friend.id);
                        return (
                          <div
                            key={friend.id}
                            className={cn(
                              "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                              isSelected
                                ? `bg-gradient-to-r ${selectedTheme.gradient} text-white shadow-lg ring-2 ring-white/20 dark:ring-gray-700/50`
                                : "bg-white/70 dark:bg-gray-700/70 hover:bg-white/90 dark:hover:bg-gray-600/80 border border-gray-200 dark:border-gray-600"
                            )}
                            onClick={() => toggleSelect(friend.id)}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <Checkbox
                              checked={isSelected}
                              className={
                                isSelected
                                  ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
                                  : "border-gray-300 dark:border-gray-600 data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
                              }
                            />
                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white/50 dark:border-gray-600/50 shadow-sm">
                              <AvatarImage
                                src={friend.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                                {friend.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p
                                className={cn(
                                  "font-medium text-sm sm:text-base truncate",
                                  isSelected
                                    ? "text-white"
                                    : "text-gray-800 dark:text-gray-200"
                                )}
                              >
                                {friend.username}
                              </p>
                              <p
                                className={cn(
                                  "text-xs",
                                  isSelected
                                    ? "text-white/80"
                                    : "text-gray-500 dark:text-gray-400"
                                )}
                              >
                                {t("createGroupModal.readyToJoin")}
                              </p>
                            </div>
                            {isSelected && (
                              <Zap className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse flex-shrink-0 drop-shadow-sm" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Step 3: Theme Selection - Enhanced for Dark Mode */}
            {step === 3 && (
              <div className="space-y-3 sm:space-y-4 animate-in slide-in-from-right-5 duration-300">
                <Label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Palette className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  {t("createGroupModal.chooseTheme")}
                </Label>

                <div className="grid grid-cols-3 sm:grid-cols-2 gap-2 sm:gap-3">
                  {groupThemes.map((theme, index) => (
                    <div
                      key={theme.name}
                      className={cn(
                        "relative p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600",
                        selectedTheme.name === theme.name
                          ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800 shadow-lg"
                          : "hover:shadow-md dark:hover:shadow-gray-900/30"
                      )}
                      onClick={() => setSelectedTheme(theme)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div
                        className={`w-full h-12 sm:h-16 rounded-md sm:rounded-lg bg-gradient-to-r ${theme.gradient} flex items-center justify-center mb-2 shadow-md ring-2 ring-white/20 dark:ring-gray-700/50`}
                      >
                        <span className="text-lg sm:text-2xl drop-shadow-sm">
                          {theme.icon}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-center truncate text-gray-700 dark:text-gray-300">
                        {theme.name}
                      </p>
                      {selectedTheme.name === theme.name && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center shadow-md">
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Preview - Enhanced for Dark Mode */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg sm:rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 backdrop-blur-sm">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t("createGroupModal.previewGroup")}
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r ${selectedTheme.gradient} flex items-center justify-center shadow-md ring-2 ring-white/20 dark:ring-gray-700/50`}
                    >
                      <span className="text-base sm:text-lg drop-shadow-sm">
                        {selectedTheme.icon}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base truncate text-gray-800 dark:text-gray-200">
                        {groupName || t("createGroupModal.defaultGroupName")}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {selected.length + 1}{" "}
                        {t("createGroupModal.memberCount")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Enhanced for Dark Mode */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="w-full sm:flex-1 h-10 sm:h-12 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-300 order-2 sm:order-1"
                  disabled={isLoading}
                >
                  {t("createGroupModal.back")}
                </Button>
              )}

              {step < 3 ? (
                <Button
                  onClick={nextStep}
                  disabled={
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2)
                  }
                  className={`w-full sm:flex-1 h-10 sm:h-12 bg-gradient-to-r ${selectedTheme.gradient} hover:shadow-lg transition-all duration-200 hover:scale-[1.02] text-white border-0 order-1 sm:order-2 shadow-md`}
                >
                  <span className="mr-2">{t("createGroupModal.continue")}</span>
                  <Zap className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreate}
                  disabled={isLoading || !groupName || selected.length === 0}
                  className={`w-full sm:flex-1 h-10 sm:h-12 bg-gradient-to-r ${selectedTheme.gradient} hover:shadow-lg transition-all duration-200 hover:scale-[1.02] text-white border-0 order-1 sm:order-2 shadow-md`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">
                        {t("createGroupModal.creatingGroupFull")}
                      </span>
                      <span className="sm:hidden">
                        {t("createGroupModal.creatingGroupShort")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">
                        {t("createGroupModal.createGroupFull")}
                      </span>
                      <span className="sm:hidden">
                        {t("createGroupModal.createGroupShort")}
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
