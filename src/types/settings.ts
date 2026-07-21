export interface AppConfig {
  base_url: string;
  api_key: string;
  model: string;
  system_prompt: string;
  shortcut?: string;
}

export const DEFAULT_CONFIG: AppConfig = {
  base_url: "https://api.openai.com/v1",
  api_key: "",
  model: "gpt-4o-mini",
  system_prompt:
    "You are KAI, a helpful, ultra-fast AI assistant desktop overlay.",
  shortcut: "Super+X",
};
