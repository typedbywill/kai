import { invoke } from "@tauri-apps/api/core";
import { isTauriEnv } from "../utils/env";

export interface ModelInfo {
  id: string;
  name: string;
}

export async function listModels(): Promise<ModelInfo[]> {
  if (!isTauriEnv()) {
    try {
      const configRaw = localStorage.getItem("kai_config");
      if (!configRaw) return [];
      const config = JSON.parse(configRaw) as {
        base_url?: string;
        api_key?: string;
      };
      const baseUrl = config.base_url || "https://api.openai.com/v1";
      const url = baseUrl.endsWith("/")
        ? `${baseUrl}models`
        : `${baseUrl}/models`;

      const headers: Record<string, string> = {};
      if (config.api_key?.trim()) {
        headers["Authorization"] = `Bearer ${config.api_key.trim()}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) return [];

      const data = (await response.json()) as {
        data?: Array<{ id: string }>;
      };
      return (
        data.data?.map((m) => ({ id: m.id, name: m.id })) ?? []
      );
    } catch {
      return [];
    }
  }

  try {
    return await invoke<ModelInfo[]>("list_models");
  } catch (err) {
    console.error("Failed to list models:", err);
    return [];
  }
}
