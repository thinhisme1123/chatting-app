"use client";
import { useState } from "react";

export default function SmartReply({ lastMessage, onSelect }: { lastMessage: string; onSelect: (text: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/smart-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastMessage }),
      });

      const data = await res.json();
      if (res.ok) {
        const options = data.reply.split("\n").filter(Boolean);
        setSuggestions(options);
      }
    } catch (err) {
      console.error("❌ Error fetching smart reply:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-3 py-1 bg-blue-500 text-white rounded-md"
      >
        {loading ? "Đang gợi ý..." : "Gợi ý trả lời"}
      </button>

      {suggestions.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-300"
              onClick={() => onSelect(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
