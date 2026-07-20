import { invoke } from "@tauri-apps/api/core";

export function isTauriEnv() {
  return typeof window !== "undefined" && (
    window.__TAURI_INTERNALS__ !== undefined ||
    window.__TAURI__ !== undefined ||
    window.__TAURI_IPC__ !== undefined
  );
}

const DEFAULT_CONFIG = {
  base_url: "https://api.openai.com/v1",
  api_key: "",
  model: "gpt-4o-mini",
  system_prompt: "You are KAI, a helpful, ultra-fast AI assistant desktop overlay.",
};

export async function loadSettings() {
  if (isTauriEnv()) {
    try {
      return await invoke("load_settings");
    } catch (err) {
      console.error("Failed to load settings via Tauri IPC:", err);
    }
  }

  // Fallback to localStorage for browser dev environment
  try {
    const saved = localStorage.getItem("kai_config");
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Failed to read settings from localStorage:", e);
  }

  return DEFAULT_CONFIG;
}

export async function saveSettings(config) {
  if (isTauriEnv()) {
    try {
      await invoke("save_settings", { config });
      // Also sync to localStorage
      localStorage.setItem("kai_config", JSON.stringify(config));
      return true;
    } catch (err) {
      console.error("Failed to save settings via Tauri IPC:", err);
      throw err;
    }
  }

  // Web Browser fallback
  try {
    localStorage.setItem("kai_config", JSON.stringify(config));
    return true;
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
    throw err;
  }
}
