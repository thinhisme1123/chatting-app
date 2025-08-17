import { useEffect, useRef, useState } from "react";
import { callSocket } from "../sockets/callSocket";
import { User } from "../domain/entities/User";

type CallType = "audio" | "video";

interface IncomingCallPayload {
  from: { id: string; username: string };
  offer: RTCSessionDescriptionInit;
  callType: CallType;
}

interface AnsweredPayload {
  answer: RTCSessionDescriptionInit;
  to: string;
}

interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
}

type UseWebRTCProps = {
  fromUser: User;
  localUserId: string;
  remoteUserId: string;
  onRemoteStream: (stream: MediaStream) => void;
  role: "caller" | "callee";
};

export const useWebRTC = ({
  fromUser,
  localUserId,
  remoteUserId,
  onRemoteStream,
  role,
}: UseWebRTCProps) => {
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (role === "caller") {
      callSocket.onAnswered(
        async (data: { to: string; answer: RTCSessionDescriptionInit }) => {
          if (data.to !== localUserId) return;
          if (!peerRef.current) return;

          // Prevent duplicate setRemoteDescription calls
          if (peerRef.current.signalingState !== "have-local-offer") {
            console.warn(
              "[WebRTC] Ignored answer because state =",
              peerRef.current.signalingState
            );
            return;
          }

          try {
            await peerRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
            console.log("[WebRTC] Remote description set successfully.");
          } catch (err) {
            console.error("[WebRTC] Failed to set remote description", err);
          }
        }
      );
    }

    if (role === "callee") {
      callSocket.onIncomingCall(
        async ({ from, offer, callType }: IncomingCallPayload) => {
          if (from.id !== remoteUserId) return;
          if (!peerRef.current) {
            await initPeer(callType);
          }
          await peerRef.current!.setRemoteDescription(
            new RTCSessionDescription(offer)
          );

          const answer = await peerRef.current!.createAnswer();
          await peerRef.current!.setLocalDescription(answer);

          callSocket.answerCall({ to: from.id, answer });
        }
      );
    }

    callSocket.onIceCandidate(async ({ candidate }: IceCandidatePayload) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      // TODO: cleanup listeners if needed
    };
  }, [role, localUserId, remoteUserId]);

  const initPeer = async (callType: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    setLocalStream(stream);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        callSocket.sendIceCandidate({
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      onRemoteStream(event.streams[0]);
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    peerRef.current = pc;
    return pc;
  };

  const startCall = async (callType: CallType) => {
    if (role !== "caller") return;
    const pc = await initPeer(callType);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    callSocket.callUser({
      to: remoteUserId,
      from: fromUser,
      offer,
      callType,
    });
  };

  return {
    localStream,
    startCall,
    initPeer,
    peerRef,
  };
};
