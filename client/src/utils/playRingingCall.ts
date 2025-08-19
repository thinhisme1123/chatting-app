export function playRingingCall() {
  if (
    typeof window !== "undefined" &&
    document.visibilityState === "visible"
  ) {
    const audio = new Audio("/sound/zalo_ringing.mp3");
    audio.play().catch((err) => {
      console.warn("🔇 Cannot play sound yet:", err.message);
    });
  }
}