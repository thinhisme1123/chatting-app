import { useEffect, useRef, useState } from "react";
import { callSocket } from "../sockets/callSocket";

export const useWebRTC = ({
  localUserId,
  remoteUserId,
  onRemoteStream,
}: {
  localUserId: string;
  remoteUserId: string;
  onRemoteStream: (stream: MediaStream) => void;
}) => {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const handleIceCandidate = (data: { candidate: RTCIceCandidate }) => {
      peerRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
    };

    const handleAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      await peerRef.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
    };

    const handleRemoteICE = (cb: any) => callSocket.onIceCandidate(cb);

    callSocket.onAnswered(handleAnswer);
    handleRemoteICE(handleIceCandidate);

    return () => {
      // Clean up listeners
    };
  }, []);

  const createPeer = async (callType: "audio" | "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    setLocalStream(stream);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        callSocket.sendIceCandidate({ to: remoteUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      onRemoteStream(event.streams[0]);
    };

    peerRef.current = pc;
    return pc;
  };

  return {
    localStream,
    createPeer,
    peerRef,
  };
};
