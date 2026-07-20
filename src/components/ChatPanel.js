import { createMessageBubble } from "./MessageBubble.js";
import { createInputBar } from "./InputBar.js";
import { createThemeToggle } from "./ThemeToggle.js";
import { createSettingsPanel } from "./SettingsPanel.js";
import { streamChat } from "../services/ai.js";
import { loadSettings } from "../services/settings.js";

export function createChatPanel() {
  const root = document.createElement("div");
  root.className = "kai-overlay-container h-full w-full flex flex-col overflow-hidden select-none";

  // Header
  const header = document.createElement("header");
  header.className = "h-14 px-4 border-b border-neutral-200/50 dark:border-neutral-800/80 flex items-center justify-between bg-neutral-100/40 dark:bg-neutral-900/40 backdrop-blur-lg shrink-0";

  header.innerHTML = `
    <div class="flex items-center gap-2.5">
      <div class="w-7 h-7 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs shadow-md">
        K
      </div>
      <div>
        <h1 class="text-xs font-bold tracking-wider uppercase text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          KAI
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </h1>
        <p id="model-badge" class="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">gpt-4o-mini</p>
      </div>
    </div>

    <div class="flex items-center gap-1">
      <button id="clear-chat" class="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-500/10 rounded-xl transition-colors" title="Clear Chat">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>

      <button id="open-settings" class="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-500/10 rounded-xl transition-colors" title="Settings">
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
        <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
          Press <kbd class="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded font-mono text-[10px]">Meta + X</kbd> anytime to toggle overlay.
        </p>
      </div>
    `;
  };

  renderWelcome();
  root.appendChild(messagesList);

  // Model badge loader
  const modelBadge = header.querySelector("#model-badge");
  const updateModelBadge = async () => {
    const cfg = await loadSettings();
    modelBadge.textContent = cfg.model || "gpt-4o-mini";
  };
  updateModelBadge();

  // History state
  let conversationHistory = [];

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
      conversationHistory,
      (chunk) => {
        if (chunk === "[DONE]") {
          inputBar.setDisabled(false);
          inputBar.focus();
          conversationHistory.push({ role: "user", content: promptText });
          conversationHistory.push({ role: "assistant", content: fullResponse });
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

  // Clear Chat Listener
  header.querySelector("#clear-chat").addEventListener("click", () => {
    conversationHistory = [];
    renderWelcome();
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
