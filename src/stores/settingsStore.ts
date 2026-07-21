import { createStore } from "./createStore";
import type { AppConfig } from "../types/settings";
import { DEFAULT_CONFIG } from "../types/settings";
import { loadSettings, saveSettings } from "../ipc/settings";

interface SettingsState {
  config: AppConfig;
  isLoaded: boolean;
  isSaving: boolean;
}

const initialState: SettingsState = {
  config: { ...DEFAULT_CONFIG },
  isLoaded: false,
  isSaving: false,
};

export const settingsStore = createStore<SettingsState>(initialState);

export async function loadConfig(): Promise<void> {
  try {
    const config = await loadSettings();
    settingsStore.set({ config, isLoaded: true });
  } catch (err) {
    console.error("Failed to load settings:", err);
    settingsStore.set({ isLoaded: true });
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  settingsStore.set({ isSaving: true });
  try {
    await saveSettings(config);
    settingsStore.set({ config, isSaving: false });
  } catch (err) {
    settingsStore.set({ isSaving: false });
    throw err;
  }
}
