import { loadSettings, saveSettings } from "../ipc/settings";
import { createModelSelector } from "./ModelSelector";
import { qs } from "../utils/dom";
import type { AppConfig } from "../types/settings";

export function createSettingsPanel(
  onClose?: (config?: AppConfig) => void,
): HTMLElement {
  const container = document.createElement("div");
  container.className =
    "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-pop-in select-none";
  container.id = "settings-panel";

  const panel = document.createElement("div");
  panel.className =
    "w-full max-w-2xl h-[420px] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden";

  panel.innerHTML = `
    <!-- Header -->
    <div class="h-12 px-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs shadow-sm">
          ⚙
        </div>
        <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">Settings</h3>
      </div>
      <button id="close-settings" class="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <!-- Body: Sidebar Tabs + Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar Tabs -->
      <div class="w-48 border-r border-neutral-200 dark:border-neutral-800 p-3 flex flex-col gap-1.5 bg-neutral-50/40 dark:bg-neutral-900/30 shrink-0">
        <button data-tab="model" class="tab-btn active w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 transition-all bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          <span>API & Model</span>
        </button>
        <button data-tab="persona" class="tab-btn w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span>System Persona</span>
        </button>
        <button data-tab="shortcuts" class="tab-btn w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          <span>Shortcuts & Overlay</span>
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 p-5 overflow-y-auto">
        <!-- Tab 1: Model & API -->
        <div id="tab-content-model" class="tab-content flex flex-col gap-4">
          <div>
            <label class="block text-xs text-neutral-500 dark:text-neutral-400 font-semibold mb-1">Base API URL</label>
            <input type="text" id="setting-base-url" class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors" placeholder="https://api.openai.com/v1">
            <p class="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">Supports OpenAI, OpenRouter, LM Studio, Ollama, vLLM, etc.</p>
          </div>

          <div>
            <label class="block text-xs text-neutral-500 dark:text-neutral-400 font-semibold mb-1">API Key</label>
            <input type="password" id="setting-api-key" class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors font-mono" placeholder="sk-...">
            <p class="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">Stored securely in your system's keyring.</p>
          </div>

          <div id="model-selector-mount"></div>
        </div>

        <!-- Tab 2: Persona -->
        <div id="tab-content-persona" class="tab-content hidden flex flex-col gap-3">
          <div>
            <label class="block text-xs text-neutral-500 dark:text-neutral-400 font-semibold mb-1">System Prompt</label>
            <textarea id="setting-system-prompt" rows="7" class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors resize-none leading-relaxed" placeholder="You are KAI, a helpful AI assistant..."></textarea>
            <p class="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">Defines KAI's personality and system instructions for every chat context.</p>
          </div>
        </div>

        <!-- Tab 3: Shortcuts -->
        <div id="tab-content-shortcuts" class="tab-content hidden flex flex-col gap-3 text-xs">
          <div class="p-3 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p class="font-medium text-neutral-800 dark:text-neutral-200">Global Overlay Shortcut</p>
              <p class="text-[10px] text-neutral-400 mt-0.5">Press anytime from any app to toggle KAI</p>
            </div>
            <input type="text" id="setting-shortcut" class="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-mono font-bold shadow-sm border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 text-xs text-center w-28 focus:outline-none focus:border-black dark:focus:border-white" placeholder="Super+X">
          </div>
          <div class="p-3 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p class="font-medium text-neutral-800 dark:text-neutral-200">Capture Selected Text</p>
              <p class="text-[10px] text-neutral-400 mt-0.5">Grab selected text and open KAI with it</p>
            </div>
            <kbd class="px-2.5 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-mono font-bold shadow-sm border border-neutral-200 dark:border-neutral-700">Meta + Shift + X</kbd>
          </div>
          <div class="p-3 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p class="font-medium text-neutral-800 dark:text-neutral-200">Screen Region Capture</p>
              <p class="text-[10px] text-neutral-400 mt-0.5">Capture a screen region as image attachment</p>
            </div>
            <kbd class="px-2.5 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-mono font-bold shadow-sm border border-neutral-200 dark:border-neutral-700">Meta + Shift + S</kbd>
          </div>
          <div class="p-3 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p class="font-medium text-neutral-800 dark:text-neutral-200">Auto-Hide on Focus Loss</p>
              <p class="text-[10px] text-neutral-400 mt-0.5">Closes window automatically when focus moves away</p>
            </div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">Active</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="h-14 px-5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50">
      <button id="cancel-settings" class="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
        Cancel
      </button>
      <button id="save-settings" class="bg-black dark:bg-white text-white dark:text-black font-semibold text-xs py-2 px-5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5">
        Save & Apply
      </button>
    </div>
  `;

  container.appendChild(panel);

  const baseUrlInput = qs<HTMLInputElement>(panel, "#setting-base-url");
  const apiKeyInput = qs<HTMLInputElement>(panel, "#setting-api-key");
  const shortcutInput = qs<HTMLInputElement>(panel, "#setting-shortcut");
  const systemPromptInput = qs<HTMLTextAreaElement>(panel, "#setting-system-prompt");
  const modelSelectorMount = qs<HTMLElement>(panel, "#model-selector-mount");

  let selectedModel = "";

  // Load active settings
  void loadSettings().then((cfg) => {
    baseUrlInput.value = cfg.base_url || "";
    apiKeyInput.value = cfg.api_key || "";
    shortcutInput.value = cfg.shortcut || "Super+X";
    systemPromptInput.value = cfg.system_prompt || "";
    selectedModel = cfg.model || "gpt-4o-mini";

    // Mount model selector after settings loaded
    const modelSelector = createModelSelector(selectedModel, (model) => {
      selectedModel = model;
    });
    modelSelectorMount.appendChild(modelSelector.element);
  });

  // Tab Switching Logic
  const tabButtons = panel.querySelectorAll<HTMLButtonElement>(".tab-btn");
  const tabContents = panel.querySelectorAll<HTMLElement>(".tab-content");

  for (const btn of tabButtons) {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      for (const b of tabButtons) {
        b.className =
          "tab-btn w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60";
      }
      btn.className =
        "tab-btn active w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 transition-all bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm";

      for (const content of tabContents) {
        if (content.id === `tab-content-${targetTab}`) {
          content.classList.remove("hidden");
        } else {
          content.classList.add("hidden");
        }
      }
    });
  }

  // Close / Cancel
  const closePanel = (): void => {
    container.remove();
    onClose?.();
  };

  qs(panel, "#close-settings").addEventListener("click", closePanel);
  qs(panel, "#cancel-settings").addEventListener("click", closePanel);

  // Save
  qs(panel, "#save-settings").addEventListener("click", () => {
    const config: AppConfig = {
      base_url: baseUrlInput.value.trim() || "https://api.openai.com/v1",
      api_key: apiKeyInput.value.trim(),
      model: selectedModel || "gpt-4o-mini",
      system_prompt: systemPromptInput.value.trim(),
      shortcut: shortcutInput.value.trim() || "Super+X",
    };

    void saveSettings(config)
      .then(() => {
        container.remove();
        onClose?.(config);
      })
      .catch((e: unknown) => {
        alert("Failed to save settings: " + String(e));
      });
  });

  return container;
}
