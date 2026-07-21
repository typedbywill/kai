/**
 * Formats an ISO date string into a short, human-readable format.
 */
export function formatDate(isoString: string | undefined): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return (
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " - " +
      d.toLocaleDateString([], { day: "2-digit", month: "2-digit" })
    );
  } catch {
    return "";
  }
}

/**
 * Formats a byte count into a human-readable size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Truncates a string to a max length, appending "..." if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
