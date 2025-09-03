export function decodeMessage(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded))); 
  } catch {
    return encoded; // fallback if not base64
  }
}

