import { loadSettings, saveSettings } from "../services/settings.js";

export function createSettingsPanel(onClose) {
  const container = document.createElement("div");
  container.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in";

  const panel = document.createElement("div");
  panel.className = "w-full max-w-sm bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-4";

  panel.innerHTML = `
    <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        <h3 class="text-sm font-semibold tracking-wide">Settings</h3>
      </div>
      <button id="close-settings" class="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <div class="flex flex-col gap-3 text-xs">
      <div>
        <label class="block text-neutral-500 dark:text-neutral-400 font-medium mb-1">Base API URL</label>
        <input type="text" id="setting-base-url" class="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors" placeholder="https://api.openai.com/v1">
        <p class="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">Supports OpenAI, OpenRouter, LM Studio, Ollama, etc.</p>
      </div>

      <div>
        <label class="block text-neutral-500 dark:text-neutral-400 font-medium mb-1">API Key</label>
        <input type="password" id="setting-api-key" class="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors" placeholder="sk-...">
      </div>

      <div>
        <label class="block text-neutral-500 dark:text-neutral-400 font-medium mb-1">Model Name</label>
        <input type="text" id="setting-model" class="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors" placeholder="gpt-4o-mini">
      </div>

      <div>
        <label class="block text-neutral-500 dark:text-neutral-400 font-medium mb-1">System Prompt</label>
        <textarea id="setting-system-prompt" rows="2" class="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none" placeholder="You are KAI..."></textarea>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
      <button id="save-settings" class="w-full bg-black dark:bg-white text-white dark:text-black font-semibold text-xs py-2 px-4 rounded-xl hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-1.5">
        Save & Apply
      </button>
    </div>
  `;

  container.appendChild(panel);

  const baseUrlInput = panel.querySelector("#setting-base-url");
  const apiKeyInput = panel.querySelector("#setting-api-key");
  const modelInput = panel.querySelector("#setting-model");
  const systemPromptInput = panel.querySelector("#setting-system-prompt");

  loadSettings().then((cfg) => {
    baseUrlInput.value = cfg.base_url || "";
    apiKeyInput.value = cfg.api_key || "";
    modelInput.value = cfg.model || "";
    systemPromptInput.value = cfg.system_prompt || "";
  });

  panel.querySelector("#close-settings").addEventListener("click", () => {
    container.remove();
    if (onClose) onClose();
  });

  panel.querySelector("#save-settings").addEventListener("click", async () => {
    const config = {
      base_url: baseUrlInput.value.trim() || "https://api.openai.com/v1",
      api_key: apiKeyInput.value.trim(),
      model: modelInput.value.trim() || "gpt-4o-mini",
      system_prompt: systemPromptInput.value.trim(),
    };

    try {
      await saveSettings(config);
      container.remove();
      if (onClose) onClose(config);
    } catch (e) {
      alert("Failed to save settings: " + e);
    }
  });

  return container;
}
