export function truncate(text: string, length = 50) {
  return text.length > length ? `${text.slice(0, length)}...` : text;
}
