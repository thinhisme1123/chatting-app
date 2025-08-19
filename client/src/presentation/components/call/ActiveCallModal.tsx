import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


type ActiveCallModalProps = {
  open: boolean;
  onEnd: () => void;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callType: "audio" | "video";
};

export const ActiveCallModal = ({
  open,
  onEnd,
  localStream,
  remoteStream,
  callType,
}: ActiveCallModalProps) => {
  if (!open) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="w-full max-w-3xl">
        <div className="flex flex-col items-center">
          {callType === "video" ? (
            <div className="flex gap-4">
              <video
                autoPlay
                playsInline
                muted
                ref={(video) => {
                  if (video && localStream) video.srcObject = localStream;
                }}
                className="w-1/3 rounded-lg"
              />
              <video
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && remoteStream) video.srcObject = remoteStream;
                }}
                className="w-2/3 rounded-lg"
              />
            </div>
          ) : (
            <p className="text-lg">🔊 Cuộc gọi thoại đang diễn ra...</p>
          )}

          <Button
            variant="destructive"
            className="mt-4"
            onClick={onEnd}
          >
            Kết thúc cuộc gọi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
