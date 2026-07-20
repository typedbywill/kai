const STORAGE_KEY = 'kai_overlay_settings_v1';

export const DEFAULT_SETTINGS = {
  baseUrl: 'http://localhost:11434/v1',
  apiKey: 'ollama',
  model: 'llama3.2',
  systemPrompt: 'You are KAI, a helpful, precise desktop AI assistant overlay. Keep answers concise, clear, and well-formatted with Markdown.',
  autoHide: true,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
