// utils/playNotificationSound.ts
export function playNotificationSound() {
  if (document.visibilityState === "visible") {
    const audio = new Audio("/sound/notification.mp3");
    audio.play().catch((err) => {
      console.warn("🔇 Cannot play sound yet:", err.message);
    });
  }
}
