import { invoke, Channel } from "@tauri-apps/api/core";
import { isTauriEnv, loadSettings } from "./settings.js";

export async function streamChat(prompt, history, onChunk, onError) {
  if (isTauriEnv()) {
    try {
      const channel = new Channel();
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
      console.warn("Tauri stream_chat failed, trying web fallback:", err);
    }
  }

  // Web Browser / Fallback Direct Stream (using fetch)
  try {
    const config = await loadSettings();
    const messages = [];

    if (config.system_prompt && config.system_prompt.trim()) {
      messages.push({ role: "system", content: config.system_prompt });
    }

    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: "user", content: prompt });

    const url = config.base_url.endsWith('/')
      ? `${config.base_url}chat/completions`
      : `${config.base_url}/chat/completions`;

    const headers = {
      "Content-Type": "application/json",
    };
    if (config.api_key && config.api_key.trim()) {
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

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.replace(/^data:\s*/, "");
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

    onChunk("[DONE]");
  } catch (err) {
    if (onError) {
      onError(err.message || "Unknown streaming error occurred");
    }
  }
}
