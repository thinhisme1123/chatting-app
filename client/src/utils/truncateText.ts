export function truncate(text: string, isGroup: boolean): string {
  let maxLength: number = 20;
  if(isGroup) 
    maxLength = 10;
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}
