import { useEffect, useRef, useCallback } from "react";

export default function LiveFeed({ embedded }) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);

  const start = useCallback(async () => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:13.233.156.209:3478?transport=udp",
          username: "user",
          credential: "cyberwarden123",
        },
        {
          urls: "turn:13.233.156.209:3478?transport=tcp",
          username: "user",
          credential: "cyberwarden123",
        },
      ],
    });

    pcRef.current = pc;

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    // Reconnect on failure
    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        console.warn("WebRTC dropped, reconnecting...");
        setTimeout(start, 3000);
      }
    };

    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const res = await fetch("https://epic.akiyaa.online/live/stream/whep", {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offer.sdp,
    });

    if (!res.ok) {
      console.error("WHEP fetch failed, retrying...");
      setTimeout(start, 3000);
      return;
    }

    const answer = { type: "answer", sdp: await res.text() };
    await pc.setRemoteDescription(answer);
  }, []);

  useEffect(() => {
    start();
    return () => pcRef.current?.close();
  }, [start]);

  return (
    <div
      className={
        embedded ? "w-full" : (
          "min-h-screen bg-black flex items-center justify-center"
        )
      }
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls
        className="w-full max-w-5xl rounded-xl"
      />
    </div>
  );
}
