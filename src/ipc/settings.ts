import { invoke } from "@tauri-apps/api/core";
import type { AppConfig } from "../types/settings";
import { DEFAULT_CONFIG } from "../types/settings";
import { isTauriEnv } from "../utils/env";

export async function loadSettings(): Promise<AppConfig> {
  if (isTauriEnv()) {
    try {
      return await invoke<AppConfig>("load_settings");
    } catch (err) {
      console.error("Failed to load settings via Tauri IPC:", err);
    }
  }

  try {
    const saved = localStorage.getItem("kai_config");
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Failed to read settings from localStorage:", e);
  }

  return { ...DEFAULT_CONFIG };
}

export async function saveSettings(config: AppConfig): Promise<void> {
  if (isTauriEnv()) {
    try {
      await invoke("save_settings", { config });
      localStorage.setItem("kai_config", JSON.stringify(config));
      return;
    } catch (err) {
      console.error("Failed to save settings via Tauri IPC:", err);
      throw err;
    }
  }

  try {
    localStorage.setItem("kai_config", JSON.stringify(config));
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
    throw err;
  }
}
