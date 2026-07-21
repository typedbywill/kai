import {
  historyStore,
  refreshHistory,
  removeChatFromHistory,
  renameChatInHistory,
  searchHistory,
} from "../stores/historyStore";
import type { ChatSession } from "../types/chat";
import { formatDate } from "../utils/format";
import { qs } from "../utils/dom";

export interface HistoryPanelAPI {
  element: HTMLElement;
  show: () => void;
  hide: () => void;
  destroy: () => void;
}

export function createHistoryPanel(
  onSelectChat: (chat: ChatSession) => void,
  onNewChat: () => void,
): HistoryPanelAPI {
  const container = document.createElement("div");
  container.id = "history-panel";
  container.className =
    "absolute top-14 left-0 right-0 bottom-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl z-40 p-4 flex flex-col hidden animate-pop-in";

  container.innerHTML = `
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200/60 dark:border-neutral-800/60 shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Histórico de Conversas</h3>
      </div>
      <div class="flex items-center gap-2">
        <button id="history-new-chat" class="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-sm">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
          Nova Conversa
        </button>
        <button id="history-close" class="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-3 shrink-0">
      <input type="text" id="history-search" placeholder="Buscar conversas..."
        class="w-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors">
    </div>

    <!-- Chat List -->
    <div id="history-list" class="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1"></div>
  `;

  const listEl = qs<HTMLElement>(container, "#history-list");
  const searchInput = qs<HTMLInputElement>(container, "#history-search");

  // Render chat list
  const renderList = (chats: ChatSession[], activeChatId?: string): void => {
    listEl.innerHTML = "";

    if (chats.length === 0) {
      listEl.innerHTML = `
        <div class="py-12 text-center text-neutral-400 dark:text-neutral-500 text-xs">
          Nenhuma conversa encontrada.
        </div>
      `;
      return;
    }

    for (const chat of chats) {
      const isSelected = chat.id === activeChatId;
      const item = document.createElement("div");
      item.className = `flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${
        isSelected
          ? "bg-neutral-200/70 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-700 shadow-sm"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50 border-transparent text-neutral-700 dark:text-neutral-300"
      }`;

      item.innerHTML = `
        <div class="flex-1 min-w-0 pr-2">
          <h4 class="text-xs font-semibold truncate ${isSelected ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-200"}">
            ${chat.title}
          </h4>
          <p class="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
            ${chat.messages ? chat.messages.length : 0} mensagens • ${formatDate(chat.updatedAt)}
          </p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="rename-chat-btn p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Renomear">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </button>
          <button class="delete-chat-btn p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Excluir">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      `;

      // Click to select
      item.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.closest(".delete-chat-btn") || target.closest(".rename-chat-btn")) return;
        onSelectChat(chat);
        hide();
      });

      // Delete
      const delBtn = item.querySelector(".delete-chat-btn");
      delBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        void removeChatFromHistory(chat.id);
      });

      // Rename
      const renameBtn = item.querySelector(".rename-chat-btn");
      renameBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        const newTitle = prompt("Renomear conversa:", chat.title);
        if (newTitle?.trim()) {
          void renameChatInHistory(chat.id, newTitle.trim());
        }
      });

      listEl.appendChild(item);
    }
  };

  // Subscribe to history store
  const unsubscribe = historyStore.subscribe((state) => {
    renderList(state.filteredChats);
  });

  // Search
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  searchInput.addEventListener("input", () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      void searchHistory(searchInput.value.trim());
    }, 200);
  });

  // New chat
  qs(container, "#history-new-chat").addEventListener("click", () => {
    onNewChat();
    hide();
  });

  // Close
  qs(container, "#history-close").addEventListener("click", () => hide());

  const show = (): void => {
    void refreshHistory();
    searchInput.value = "";
    container.classList.remove("hidden");
    setTimeout(() => searchInput.focus(), 50);
  };

  const hide = (): void => {
    container.classList.add("hidden");
  };

  return {
    element: container,
    show,
    hide,
    destroy: unsubscribe,
  };
}
