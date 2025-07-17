export function truncate(text: string, maxLength: number = 20): string {
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}
