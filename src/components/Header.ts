import { createThemeToggle } from "./ThemeToggle";
import { qs } from "../utils/dom";

export interface HeaderAPI {
  element: HTMLElement;
  setTitle: (title: string) => void;
  setModel: (model: string) => void;
  onNewChat: (handler: () => void) => void;
  onHistory: (handler: () => void) => void;
  onClear: (handler: () => void) => void;
  onSettings: (handler: () => void) => void;
}

export function createHeader(): HeaderAPI {
  const header = document.createElement("header");
  header.className =
    "h-14 px-3 border-b border-neutral-200/50 dark:border-neutral-800/80 flex items-center justify-between bg-neutral-100/40 dark:bg-neutral-900/40 backdrop-blur-lg shrink-0 z-10";

  header.innerHTML = `
    <div class="flex items-center gap-2 max-w-[48%] truncate">
      <div class="w-7 h-7 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs shadow-md shrink-0">
        K
      </div>
      <div class="truncate">
        <h1 id="active-chat-title" class="text-xs font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate" title="Nova conversa">
          Nova conversa
        </h1>
        <p id="model-badge" class="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate">gpt-4o-mini</p>
      </div>
    </div>

    <div class="flex items-center gap-1 shrink-0">
      <button id="new-chat-btn" class="p-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 hover:bg-neutral-500/10 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold" title="Novo Chat">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
        <span class="hidden sm:inline">Novo Chat</span>
      </button>

      <button id="chats-history-btn" class="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-500/10 rounded-xl transition-colors" title="Histórico de Chats">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </button>

      <button id="clear-chat-btn" class="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors" title="Limpar conversa atual">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>

      <button id="open-settings-btn" class="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-500/10 rounded-xl transition-colors" title="Configurações">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      </button>

      <div id="theme-toggle-container"></div>
    </div>
  `;

  // Mount theme toggle
  const themeContainer = qs(header, "#theme-toggle-container");
  themeContainer.appendChild(createThemeToggle());

  const titleEl = qs(header, "#active-chat-title");
  const modelBadge = qs(header, "#model-badge");

  return {
    element: header,

    setTitle: (title: string) => {
      titleEl.textContent = title;
      titleEl.title = title;
    },

    setModel: (model: string) => {
      modelBadge.textContent = model;
    },

    onNewChat: (handler: () => void) => {
      qs(header, "#new-chat-btn").addEventListener("click", handler);
    },

    onHistory: (handler: () => void) => {
      qs(header, "#chats-history-btn").addEventListener("click", handler);
    },

    onClear: (handler: () => void) => {
      qs(header, "#clear-chat-btn").addEventListener("click", handler);
    },

    onSettings: (handler: () => void) => {
      qs(header, "#open-settings-btn").addEventListener("click", handler);
    },
  };
}
