import { invoke } from "@tauri-apps/api/core";
import { isTauriEnv } from "../utils/env";

export interface CaptureResult {
  content: string;
  type: "text" | "image";
}

export async function captureSelection(): Promise<CaptureResult | null> {
  if (!isTauriEnv()) {
    console.warn("captureSelection is only available in Tauri");
    return null;
  }

  try {
    const content = await invoke<string>("capture_selection");
    return content ? { content, type: "text" } : null;
  } catch (err) {
    console.error("Failed to capture selection:", err);
    return null;
  }
}

export async function captureScreen(): Promise<CaptureResult | null> {
  if (!isTauriEnv()) {
    console.warn("captureScreen is only available in Tauri");
    return null;
  }

  try {
    const content = await invoke<string>("capture_screen");
    return content ? { content, type: "image" } : null;
  } catch (err) {
    console.error("Failed to capture screen:", err);
    return null;
  }
}
