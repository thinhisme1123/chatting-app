import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/src/domain/entities/User";

type Props = {
  open: boolean;
  onCancel: () => void;
  callee: User | null;
  callType: "audio" | "video";
  status: "ringing" | "rejected";
};

export const OutgoingCallModal = ({
  open,
  onCancel,
  callee,
  callType,
  status,
}: Props) => {
  if (!callee) return null;

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          {status === "ringing" ? (
            <DialogTitle>Bạn đang gọi cho {callee.username}</DialogTitle>
          ) : (
            <DialogTitle>{callee.username} đã từ chối cuộc gọi</DialogTitle>
          )}
        </DialogHeader>

        <div className="text-center text-gray-500 mb-4">
          {status === "ringing"
            ? `Cuộc gọi ${callType === "video" ? "video" : "thoại"}`
            : "Cuộc gọi đã kết thúc"}
        </div>

        {status === "ringing" && (
          <div className="flex justify-center mb-4">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
            <span className="ml-2 text-sm text-gray-400">
              Đang đổ chuông...
            </span>
          </div>
        )}

        <DialogFooter className="flex justify-center gap-4">
          <Button variant="destructive" onClick={onCancel}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
