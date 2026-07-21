import { invoke, Channel } from "@tauri-apps/api/core";
import type { ChatMessage } from "../types/chat";
import type { AppConfig } from "../types/settings";
import { DEFAULT_CONFIG } from "../types/settings";
import { isTauriEnv } from "../utils/env";

export async function streamChat(
  prompt: string,
  history: ChatMessage[],
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
): Promise<void> {
  if (isTauriEnv()) {
    try {
      const channel = new Channel<string>();
      channel.onmessage = (message) => {
        onChunk(message);
      };

      await invoke("stream_chat", {
        prompt,
        history,
        onChunk: channel,
      });
      return;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      onError(message);
      return;
    }
  }

  // Web browser fallback (direct fetch streaming)
  try {
    const configRaw = localStorage.getItem("kai_config");
    const config: AppConfig = configRaw
      ? { ...DEFAULT_CONFIG, ...JSON.parse(configRaw) }
      : DEFAULT_CONFIG;

    const messages: Array<{ role: string; content: string }> = [];

    if (config.system_prompt?.trim()) {
      messages.push({ role: "system", content: config.system_prompt });
    }

    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: prompt });

    const url = config.base_url.endsWith("/")
      ? `${config.base_url}chat/completions`
      : `${config.base_url}/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.api_key?.trim()) {
      headers["Authorization"] = `Bearer ${config.api_key.trim()}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model || "gpt-4o-mini",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error (${response.status}): ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body stream available");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.replace(/^data:\s*/, "");
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    onChunk("[DONE]");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown streaming error occurred";
    onError(message);
  }
}
