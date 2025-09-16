// MessageItem.tsx
import { useState, useRef, useEffect } from "react";
import { ReactionBar } from "./ReactionBar";
import { MessageOptions } from "../chat/MessageOptions";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { Smile } from "lucide-react";
import { User } from "@/src/domain/entities/User";

interface MessageItemProps {
  message: any;
  currentUser: User;
  selectedUser: any;
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onDeleteReaction: (messageId: string, emoji: string) => void;
  onReply: (
    id: string,
    senderName: string,
    content: string,
    imageUrl: string
  ) => void;
  onCopy: (content: string) => void;
  decodeMessage: (msg: string) => string;
  t: (key: string) => string;
}

export function MessageItem({
  message,
  currentUser,
  selectedUser,
  onReact,
  onDelete,
  onEdit,
  onDeleteReaction,
  onReply,
  onCopy,
  decodeMessage,
  t,
}: MessageItemProps) {
  const [showIcon, setShowIcon] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isReactionHover, setIsReactionHover] = useState(false);

  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = (delay = 160) => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      // if user isn't hovering the reaction area, hide
      if (!isReactionHover) {
        setShowIcon(false);
        setShowReactions(false);
      }
    }, delay);
  };

  useEffect(() => {
    // cleanup on unmount
    return () => clearHideTimer();
  }, []);

  const handleReact = async (emoji: string) => {
    await onReact(message.id, emoji);
    setShowReactions(false);
  };

  const handleDeleteMessage = () => {
    onDelete(message.id);
  };

  const handleEditMessage = (content: string) => {
    onEdit(message.id, content);
  };

  const handleReplyToMessage = () => {
    onReply(message.id, message.senderName, message.content, message.imageUrl);
  };

  const handleCopyMessage = () => {
    onCopy(message.content);
  };

  // aggregate reactions -> { "😂": 2, "❤️": 1}
  const aggregatedReactions: Record<string, number> = {};
  if (message.reactions && Array.isArray(message.reactions)) {
    for (const r of message.reactions) {
      const key = r.emoji ?? r;
      aggregatedReactions[key] = (aggregatedReactions[key] || 0) + 1;
    }
  }

  return (
    <div
      key={message.id}
      className={`flex gap-3 ${message.isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => {
        clearHideTimer();
        setShowIcon(true);
      }}
      onMouseLeave={() => {
        // schedule a small delay to allow entering the reaction bar
        scheduleHide(160);
      }}
    >
      {!message.isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage
            src={
              message.senderAvatar?.trim()
                ? message.senderAvatar
                : selectedUser?.avatar?.trim()
                ? selectedUser.avatar
                : "/images/user-placeholder.jpg"
            }
            className="rounded-full object-cover w-full h-full"
          />
        </Avatar>
      )}

      <div
        className={`flex flex-col ${
          message.isOwn ? "items-end" : "items-start"
        }`}
      >
        {/* Reply Preview */}
        {message.replyTo && (
          <div
            className={`relative max-w-xs lg:max-w-md px-3 py-2 rounded-xl bg-gray-100 shadow-sm border-l-4 cursor-pointer ${
              message.isOwn ? "border-blue-500" : "border-gray-400"
            }`}
            onClick={() => {
              const el = document.getElementById(
                `message-${message.replyTo.id}`
              );
              if (el) {
                el.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
                el.classList.add("highlight-message");
                setTimeout(
                  () => el.classList.remove("highlight-message"),
                  2000
                );
              }
            }}
          >
            <p className="text-sm font-semibold text-gray-700 leading-tight">
              {message.replyTo.senderName}
            </p>

            {message.replyTo.imageUrl ? (
              <div className="mt-1 flex items-center space-x-2">
                <img
                  src={message.replyTo.imageUrl}
                  alt="reply preview"
                  className="w-12 h-12 object-cover rounded-md border"
                />
                {message.replyTo.content && (
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                    {decodeMessage(message.replyTo.content)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 truncate">
                {decodeMessage(message.replyTo.content)}
              </p>
            )}
          </div>
        )}

        {/* Message bubble + options */}
        <div
          className={`message-content flex items-center gap-1 ${
            message.isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {/* Bubble container (relative so absolute elements can anchor to it) */}
          <div className="relative group">
            <div
              id={`message-${message.id}`}
              className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow ${
                message.isOwn
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <div
                className={`text-sm break-words whitespace-pre-wrap flex flex-col ${
                  message.isOwn ? "text-right" : "text-left"
                }`}
              >
                {decodeMessage(message.content)}

                {message.edited && (
                  <span
                    className={`ml-2 text-[10px] italic ${
                      message.isOwn ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    ({t("message.edited")})
                  </span>
                )}

                {message.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={message.imageUrl}
                      alt="message image"
                      className="rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90 transition"
                      onClick={() => window.open(message.imageUrl, "_blank")}
                    />
                  </div>
                )}
              </div>

              {/* tiny smile icon & reaction bar wrapper */}
              {showIcon && (
                <div
                  // wrapper anchors icon and reaction bar together so hover can be tracked
                  className={`absolute -top-3 ${
                    message.isOwn ? "-left-6" : "-right-6"
                  } z-40`}
                  onMouseEnter={() => {
                    clearHideTimer();
                    setIsReactionHover(true);
                    setShowReactions(true);
                    setShowIcon(true);
                  }}
                  onMouseLeave={() => {
                    setIsReactionHover(false);
                    // give small delay to allow re-entering
                    scheduleHide(160);
                  }}
                >
                  <button
                    onClick={() => {
                      // click toggles the reactions (handy on small or touch)
                      setShowReactions((s) => !s);
                      setShowIcon(true);
                    }}
                    className="p-1 rounded-full bg-white/95 dark:bg-slate-800 shadow-md hover:scale-105 transition-transform focus:outline-none"
                    aria-label="react"
                  >
                    <Smile className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>

                  {/* Reaction bar (kept inside wrapper DOM so mouse transitions are smooth) */}
                  {showReactions && (
                    <div
                      className="absolute top-0 translate-y-[-110%] z-50"
                      onMouseEnter={() => {
                        clearHideTimer();
                        setIsReactionHover(true);
                        setShowReactions(true);
                        setShowIcon(true);
                      }}
                      onMouseLeave={() => {
                        setIsReactionHover(false);
                        scheduleHide(120);
                      }}
                    >
                      <ReactionBar onReact={handleReact} />
                    </div>
                  )}
                </div>
              )}

              {/* Reaction chips placed outside bubble like your screenshot */}
              {Object.keys(aggregatedReactions).length > 0 && (
                <div
                  className={`absolute -bottom-3 flex gap-1 items-center z-30 ${
                    message.isOwn ? "-left-6" : "-right-6"
                  }`}
                >
                  {Object.entries(aggregatedReactions).map(([emoji, count]) => {
                    const currentUserReacted = message.reactions?.some(
                      (r: any) =>
                        r.userId === currentUser.id && r.emoji === emoji
                    );

                    return (
                      <div
                        key={emoji}
                        className="group flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 rounded-full shadow-sm text-xs select-none relative"
                        title={`${count} reaction${count > 1 ? "s" : ""}`}
                      >
                        <span className="text-base leading-none">{emoji}</span>

                        {currentUserReacted && (
                          <button
                            onClick={() =>
                              onDeleteReaction(message.id, emoji)
                            }
                            className="absolute -top-2 -right-2 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none"
                            aria-label={`Remove ${emoji}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <MessageOptions
            messageId={message.id}
            messageContent={message.content}
            senderName={message.senderName}
            isOwn={message.isOwn}
            imageUrl={message.imageUrl}
            onDelete={handleDeleteMessage}
            onEdit={handleEditMessage}
            onReply={handleReplyToMessage}
            onCopy={handleCopyMessage}
          />
        </div>

        <p className="text-xs text-foreground mt-1">
          {new Date(message.timestamp)
            .toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace(",", " |")}
        </p>
      </div>
    </div>
  );
}
