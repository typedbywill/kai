import { loadSettings, saveSettings } from "../services/settings.js";

export function createSettingsPanel(onClose) {
  const container = document.createElement("div");
  container.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-pop-in select-none";

  const panel = document.createElement("div");
  panel.className = "w-full max-w-2xl h-[390px] bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden";

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
          </div>

          <div>
            <label class="block text-xs text-neutral-500 dark:text-neutral-400 font-semibold mb-1">Model Name</label>
            <input type="text" id="setting-model" class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors font-mono" placeholder="gpt-4o-mini">
            <div class="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
              <span class="text-neutral-400 font-medium">Presets:</span>
              <button type="button" class="preset-btn px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">gpt-4o-mini</button>
              <button type="button" class="preset-btn px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">claude-3-5-sonnet</button>
              <button type="button" class="preset-btn px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">deepseek-chat</button>
              <button type="button" class="preset-btn px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">llama3</button>
            </div>
          </div>
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
            <kbd class="px-2.5 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-mono font-bold shadow-sm border border-neutral-200 dark:border-neutral-700">Meta + X</kbd>
          </div>

          <div class="p-3 bg-neutral-100 dark:bg-neutral-900/80 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p class="font-medium text-neutral-800 dark:text-neutral-200">CLI Toggle Command</p>
              <p class="text-[10px] text-neutral-400 mt-0.5">Toggle overlay window programmatically</p>
            </div>
            <code class="px-2.5 py-1 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-mono font-bold shadow-sm border border-neutral-200 dark:border-neutral-700 text-[11px]">kai --toggle</code>
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

  const baseUrlInput = panel.querySelector("#setting-base-url");
  const apiKeyInput = panel.querySelector("#setting-api-key");
  const modelInput = panel.querySelector("#setting-model");
  const systemPromptInput = panel.querySelector("#setting-system-prompt");

  // Load active settings
  loadSettings().then((cfg) => {
    baseUrlInput.value = cfg.base_url || "";
    apiKeyInput.value = cfg.api_key || "";
    modelInput.value = cfg.model || "";
    systemPromptInput.value = cfg.system_prompt || "";
  });

  // Tab Switching Logic
  const tabButtons = panel.querySelectorAll(".tab-btn");
  const tabContents = panel.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");

      tabButtons.forEach((b) => {
        b.className = "tab-btn w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 transition-all text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60";
      });
      btn.className = "tab-btn active w-full px-3 py-2.5 rounded-xl text-xs font-medium text-left flex items-center gap-2.5 transition-all bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm";

      tabContents.forEach((content) => {
        if (content.id === `tab-content-${targetTab}`) {
          content.classList.remove("hidden");
        } else {
          content.classList.add("hidden");
        }
      });
    });
  });

  // Preset Buttons Logic
  const presetButtons = panel.querySelectorAll(".preset-btn");
  presetButtons.forEach((pBtn) => {
    pBtn.addEventListener("click", () => {
      modelInput.value = pBtn.textContent.trim();
    });
  });

  // Close / Cancel Action
  const closePanel = () => {
    container.remove();
    if (onClose) onClose();
  };

  panel.querySelector("#close-settings").addEventListener("click", closePanel);
  panel.querySelector("#cancel-settings").addEventListener("click", closePanel);

  // Save Settings Action
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
