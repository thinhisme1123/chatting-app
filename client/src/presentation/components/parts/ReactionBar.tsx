const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

export function ReactionBar({
  onReact,
}: {
  onReact: (emoji: string) => void;
}) {
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2 bg-white dark:bg-gray-800 rounded-full shadow px-3 py-1 z-50">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="hover:scale-125 transition text-xl"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
