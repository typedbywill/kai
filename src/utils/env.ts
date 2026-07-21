/**
 * Checks if the current environment is a Tauri application.
 */
export function isTauriEnv(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return (
    w.__TAURI_INTERNALS__ !== undefined ||
    w.__TAURI__ !== undefined ||
    w.__TAURI_IPC__ !== undefined
  );
}
