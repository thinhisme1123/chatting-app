import { CheckCircle, XCircle } from "lucide-react";

interface ProgressToastProps {
  message: string;
  type?: "success" | "error";
}

export function ProgressToast({ message, type = "success" }: ProgressToastProps) {
  const isSuccess = type === "success";
  return (
    <div className="relative flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg w-72 overflow-hidden">
      {isSuccess ? (
        <CheckCircle className="w-5 h-5 text-green-400" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400" />
      )}
      <span className="text-sm font-medium">{message}</span>

      {/* Progress bar at bottom */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${
          isSuccess ? "bg-green-500" : "bg-red-500"
        } animate-toast-progress`}
      />
    </div>
  );
}
