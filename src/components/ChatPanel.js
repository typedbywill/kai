import { createMessageBubble } from "./MessageBubble.js";
import { createInputBar } from "./InputBar.js";
import { createThemeToggle } from "./ThemeToggle.js";
import { createSettingsPanel } from "./SettingsPanel.js";
import { streamChat } from "../services/ai.js";
import { loadSettings } from "../services/settings.js";
import {
  getSavedChats,
  getOrCreateActiveChat,
  createNewChatSession,
  setActiveChatId,
  updateChatSession,
  deleteChatSession
} from "../services/chats.js";

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  } catch (e) {
    return "";
  }
}

export function createChatPanel() {
  const root = document.createElement("div");
  root.className = "kai-overlay-container relative h-full w-full flex flex-col overflow-hidden select-none";

  // Active chat session state
  let activeChat = getOrCreateActiveChat();

  // Header
  const header = document.createElement("header");
  header.className = "h-14 px-3 border-b border-neutral-200/50 dark:border-neutral-800/80 flex items-center justify-between bg-neutral-100/40 dark:bg-neutral-900/40 backdrop-blur-lg shrink-0 z-10";

  header.innerHTML = `
    <div class="flex items-center gap-2 max-w-[48%] truncate">
      <div class="w-7 h-7 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs shadow-md shrink-0">
        K
      </div>
      <div class="truncate">
        <h1 id="active-chat-title" class="text-xs font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate" title="${activeChat.title}">
          ${activeChat.title}
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

      <button id="clear-chat" class="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors" title="Limpar conversa atual">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>

      <button id="open-settings" class="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-500/10 rounded-xl transition-colors" title="Configurações">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
      </button>

      <div id="theme-toggle-container"></div>
    </div>
  `;

  root.appendChild(header);

  // Theme toggle button placement
  const themeToggleContainer = header.querySelector("#theme-toggle-container");
  themeToggleContainer.appendChild(createThemeToggle());

  // Messages Area
  const messagesList = document.createElement("div");
  messagesList.className = "flex-1 overflow-y-auto p-4 flex flex-col gap-2 scroll-smooth";

  const renderWelcome = () => {
    messagesList.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 select-none animate-pop-in">
        <div class="w-12 h-12 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-extrabold text-xl mb-3 shadow-md">
          K
        </div>
        <h2 class="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-1">What can I help with?</h2>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
          Press <kbd class="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded font-mono text-[10px]">Meta + X</kbd> anytime to toggle overlay.
        </p>
      </div>
    `;
  };

  const activeChatTitleEl = header.querySelector("#active-chat-title");

  const renderActiveChat = () => {
    activeChatTitleEl.textContent = activeChat.title;
    activeChatTitleEl.title = activeChat.title;

    if (!activeChat.messages || activeChat.messages.length === 0) {
      renderWelcome();
      return;
    }

    messagesList.innerHTML = "";
    activeChat.messages.forEach((msg) => {
      const bubble = createMessageBubble(msg.role, msg.content);
      messagesList.appendChild(bubble.element);
    });
    setTimeout(() => {
      messagesList.scrollTop = messagesList.scrollHeight;
    }, 0);
  };

  root.appendChild(messagesList);

  // Chats History Popover Panel
  const chatsPopover = document.createElement("div");
  chatsPopover.id = "chats-popover";
  chatsPopover.className = "absolute top-14 left-0 right-0 bottom-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl z-40 p-4 flex flex-col hidden animate-pop-in";
  chatsPopover.innerHTML = `
    <div class="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200/60 dark:border-neutral-800/60 shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Histórico de Conversas</h3>
      </div>
      <div class="flex items-center gap-2">
        <button id="popover-new-chat-btn" class="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 shadow-sm">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
          Nova Conversa
        </button>
        <button id="close-chats-popover" class="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>

    <div id="chats-list" class="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
    </div>
  `;
  root.appendChild(chatsPopover);

  const chatsListEl = chatsPopover.querySelector("#chats-list");

  const closeChatsPopover = () => {
    chatsPopover.classList.add("hidden");
  };

  const renderChatsList = () => {
    const chats = getSavedChats();
    chatsListEl.innerHTML = "";

    if (chats.length === 0) {
      chatsListEl.innerHTML = `
        <div class="py-12 text-center text-neutral-400 dark:text-neutral-500 text-xs">
          Nenhuma conversa salva ainda.
        </div>
      `;
      return;
    }

    chats.forEach((chat) => {
      const isSelected = chat.id === activeChat.id;
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
        <button class="delete-chat-btn p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0" title="Excluir conversa">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      `;

      item.addEventListener("click", () => {
        activeChat = chat;
        setActiveChatId(chat.id);
        renderActiveChat();
        closeChatsPopover();
      });

      const delBtn = item.querySelector(".delete-chat-btn");
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteChatSession(chat.id);
        activeChat = getOrCreateActiveChat();
        renderActiveChat();
        renderChatsList();
      });

      chatsListEl.appendChild(item);
    });
  };

  const handleCreateNewChat = () => {
    if (activeChat && (!activeChat.messages || activeChat.messages.length === 0)) {
      closeChatsPopover();
      inputBar.focus();
      return;
    }
    activeChat = createNewChatSession();
    renderActiveChat();
    closeChatsPopover();
    inputBar.focus();
  };

  header.querySelector("#new-chat-btn").addEventListener("click", handleCreateNewChat);
  chatsPopover.querySelector("#popover-new-chat-btn").addEventListener("click", handleCreateNewChat);

  header.querySelector("#chats-history-btn").addEventListener("click", () => {
    const isHidden = chatsPopover.classList.contains("hidden");
    if (isHidden) {
      renderChatsList();
      chatsPopover.classList.remove("hidden");
    } else {
      closeChatsPopover();
    }
  });

  chatsPopover.querySelector("#close-chats-popover").addEventListener("click", closeChatsPopover);

  // Model badge loader
  const modelBadge = header.querySelector("#model-badge");
  const updateModelBadge = async () => {
    const cfg = await loadSettings();
    modelBadge.textContent = cfg.model || "gpt-4o-mini";
  };
  updateModelBadge();

  // Initial render of active chat
  renderActiveChat();

  // Input Bar
  const inputBar = createInputBar(async (promptText) => {
    if (messagesList.querySelector("h2")) {
      messagesList.innerHTML = "";
    }

    // Add User Message
    const userMsg = createMessageBubble("user", promptText);
    messagesList.appendChild(userMsg.element);

    // Add Assistant Empty Bubble (with typing dots)
    const assistantMsg = createMessageBubble("assistant", "");
    messagesList.appendChild(assistantMsg.element);

    messagesList.scrollTop = messagesList.scrollHeight;
    inputBar.setDisabled(true);

    let fullResponse = "";

    await streamChat(
      promptText,
      activeChat.messages || [],
      (chunk) => {
        if (chunk === "[DONE]") {
          inputBar.setDisabled(false);
          inputBar.focus();
          
          if (!activeChat.messages) activeChat.messages = [];
          activeChat.messages.push({ role: "user", content: promptText });
          activeChat.messages.push({ role: "assistant", content: fullResponse });
          
          updateChatSession(activeChat.id, activeChat.messages);
          activeChatTitleEl.textContent = activeChat.title;
          activeChatTitleEl.title = activeChat.title;
          return;
        }
        fullResponse += chunk;
        assistantMsg.updateContent(fullResponse);
        messagesList.scrollTop = messagesList.scrollHeight;
      },
      (errorText) => {
        inputBar.setDisabled(false);
        assistantMsg.updateContent(`**Error:** ${errorText}\n\nPlease check your API Key & Settings.`);
        messagesList.scrollTop = messagesList.scrollHeight;
      }
    );
  });

  root.appendChild(inputBar.element);

  // Clear Current Chat Listener
  header.querySelector("#clear-chat").addEventListener("click", () => {
    if (activeChat) {
      activeChat.messages = [];
      updateChatSession(activeChat.id, []);
      renderActiveChat();
    }
  });

  // Open Settings Listener
  header.querySelector("#open-settings").addEventListener("click", () => {
    const settingsPanel = createSettingsPanel(() => {
      updateModelBadge();
    });
    root.appendChild(settingsPanel);
  });

  return root;
}


