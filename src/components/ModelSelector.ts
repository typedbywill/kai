import { listModels, type ModelInfo } from "../ipc/models";
import { qs } from "../utils/dom";

export interface ModelSelectorAPI {
  element: HTMLElement;
  refresh: () => Promise<void>;
  destroy: () => void;
}

export function createModelSelector(
  currentModel: string,
  onSelect: (model: string) => void,
): ModelSelectorAPI {
  const container = document.createElement("div");
  container.className = "flex flex-col gap-2";

  container.innerHTML = `
    <label class="block text-xs text-neutral-500 dark:text-neutral-400 font-semibold mb-1">Model Name</label>
    <div class="relative">
      <input type="text" id="model-input"
        class="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors font-mono pr-8"
        placeholder="gpt-4o-mini" value="${currentModel}">
      <button id="model-refresh-btn"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-0.5"
        title="Buscar modelos da API">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
      </button>
    </div>
    <div id="model-list" class="hidden flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto"></div>
    <div class="flex items-center gap-1.5 flex-wrap text-[10px]">
      <span class="text-neutral-400 font-medium">Presets:</span>
      <button type="button" class="preset-btn px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">gpt-4o-mini</button>
      <button type="button" class="preset-btn px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">claude-3-5-sonnet</button>
      <button type="button" class="preset-btn px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">deepseek-chat</button>
      <button type="button" class="preset-btn px-2 py-0.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors">llama3</button>
    </div>
  `;

  const modelInput = qs<HTMLInputElement>(container, "#model-input");
  const modelList = qs<HTMLElement>(container, "#model-list");
  const refreshBtn = qs<HTMLButtonElement>(container, "#model-refresh-btn");

  // Input change
  modelInput.addEventListener("input", () => {
    onSelect(modelInput.value.trim());
  });

  // Preset buttons
  const presetBtns = container.querySelectorAll<HTMLButtonElement>(".preset-btn");
  for (const btn of presetBtns) {
    btn.addEventListener("click", () => {
      const value = btn.textContent?.trim() ?? "";
      modelInput.value = value;
      onSelect(value);
    });
  }

  // Fetch models
  const refresh = async (): Promise<void> => {
    refreshBtn.classList.add("animate-spin");
    try {
      const models = await listModels();
      renderModelList(models);
    } catch {
      modelList.classList.add("hidden");
    } finally {
      refreshBtn.classList.remove("animate-spin");
    }
  };

  const renderModelList = (models: ModelInfo[]): void => {
    if (models.length === 0) {
      modelList.classList.add("hidden");
      return;
    }

    modelList.classList.remove("hidden");
    modelList.innerHTML = "";
    for (const model of models) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors text-[10px] font-mono";
      btn.textContent = model.id;
      btn.addEventListener("click", () => {
        modelInput.value = model.id;
        onSelect(model.id);
      });
      modelList.appendChild(btn);
    }
  };

  refreshBtn.addEventListener("click", () => void refresh());

  return {
    element: container,
    refresh,
    destroy: () => {
      // no active subscriptions to clean
    },
  };
}
