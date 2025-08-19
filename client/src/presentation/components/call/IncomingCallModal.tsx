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
  onAccept: () => void;
  onReject: () => void;
  caller: User | null;
  callType: "audio" | "video";
};

export const IncomingCallModal = ({
  open,
  onAccept,
  onReject,
  caller,
  callType,
}: Props) => {
  if (!caller) return null;

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{caller.username} đang gọi đến</DialogTitle>
        </DialogHeader>

        <div className="text-center text-gray-500 mb-4">
          Cuộc gọi {callType === "video" ? "video" : "thoại"}
        </div>

        <DialogFooter className="flex justify-center gap-4">
          <Button variant="destructive" onClick={onReject}>
            Từ chối
          </Button>
          <Button onClick={onAccept}>Chấp nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
