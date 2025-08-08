import { socket } from "./baseSocket"; // socket instance đã connect từ trước

export const callSocket = {
  callUser: ({ to, from, offer, callType }: any) => {
    socket.emit("call:offer", { to, from, offer, callType });
  },

  answerCall: ({ to, answer }: any) =>
    socket.emit("call:answer", { to, answer }),

  sendIceCandidate: ({ to, candidate }: any) =>
    socket.emit("call:ice-candidate", { to, candidate }),

  cancelCall: ({ to }: any) => socket.emit("call:cancel", { to }),

  rejectCall: ({ to }: any) => socket.emit("call:reject", { to }),

  endCall: ({ to }: any) => socket.emit("call:end", { to }),

  onIncomingCall: (cb: any) => socket.on("call:incoming", cb),
  onAnswered: (cb: any) => socket.on("call:answered", cb),
  onIceCandidate: (cb: any) => socket.on("call:ice-candidate", cb),
  onCancelled: (cb: any) => socket.on("call:cancelled", cb),
  onRejected: (cb: any) => socket.on("call:rejected", cb),
  onCallEnded: (cb: any) => socket.on("call:ended", cb),
};
