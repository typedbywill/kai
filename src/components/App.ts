import { createHeader } from "./Header";
import { createChatView } from "./ChatView";
import { createMessageBubble } from "./MessageBubble";
import { createInputBar } from "./InputBar";
import { createAttachmentBar } from "./AttachmentBar";
import { createHistoryPanel } from "./HistoryPanel";
import { createSettingsPanel } from "./SettingsPanel";
import { streamChat } from "../ipc/chat";
import { loadSettings } from "../ipc/settings";
import {
  chatStore,
  loadActiveChat,
  createNewChat,
  switchToChat,
  appendMessage,
  clearActiveChat,
  setStreaming,
  updateStreamingResponse,
} from "../stores/chatStore";
import { clearAttachments, getReadyAttachments } from "../stores/attachmentStore";
import type { ChatSession, ChatMessage } from "../types/chat";

export function createApp(): HTMLElement {
  const root = document.createElement("div");
  root.className =
    "kai-overlay-container relative h-full w-full flex flex-col overflow-hidden select-none";

  // ── Header ──
  const header = createHeader();
  root.appendChild(header.element);

  // ── Chat View ──
  const chatView = createChatView();
  root.appendChild(chatView.element);

  // ── Attachment Bar ──
  const attachmentBar = createAttachmentBar();
  root.appendChild(attachmentBar.element);

  // ── Input Bar ──
  const inputBar = createInputBar(handleSend);
  root.appendChild(inputBar.element);

  // ── History Panel ──
  const historyPanel = createHistoryPanel(
    (chat: ChatSession) => {
      switchToChat(chat);
      renderActiveChat();
      inputBar.focus();
    },
    () => {
      handleNewChat();
    },
  );
  root.appendChild(historyPanel.element);

  // ── Load initial state ──
  void loadActiveChat().then(() => {
    renderActiveChat();
  });

  void loadSettings().then((cfg) => {
    header.setModel(cfg.model || "gpt-4o-mini");
  });

  // ── Event Handlers ──

  function renderActiveChat(): void {
    const state = chatStore.get();
    const chat = state.activeChat;
    if (!chat) return;

    header.setTitle(chat.title);

    // Re-render chat view
    const chatViewEl = chatView.element;
    chatViewEl.innerHTML = "";

    if (chat.messages.length === 0) {
      chatViewEl.innerHTML = `
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
      return;
    }

    for (const msg of chat.messages) {
      const bubble = createMessageBubble(msg.role, msg.content);
      chatViewEl.appendChild(bubble.element);
    }
    chatView.scrollToBottom();
  }

  function handleNewChat(): void {
    const state = chatStore.get();
    if (state.activeChat && state.activeChat.messages.length === 0) {
      inputBar.focus();
      return;
    }
    createNewChat();
    renderActiveChat();
    inputBar.focus();
  }

  async function handleSend(promptText: string): Promise<void> {
    const state = chatStore.get();
    if (!state.activeChat) {
      createNewChat();
    }

    // Clear welcome message if present
    const welcome = chatView.element.querySelector("h2");
    if (welcome) {
      chatView.element.innerHTML = "";
    }

    // Get attachments
    const attachments = getReadyAttachments();

    // Build prompt with attachments context
    let fullPrompt = promptText;
    if (attachments.length > 0) {
      const attachmentTexts = attachments
        .filter((a) => a.type !== "image" && a.content)
        .map((a) => `--- ${a.name} ---\n${a.content}`)
        .join("\n\n");

      if (attachmentTexts) {
        fullPrompt = `${promptText}\n\n[Attached files]\n${attachmentTexts}`;
      }
    }

    // Add user message bubble
    chatView.addUserMessage(promptText);

    // Add assistant bubble (for streaming)
    const assistantBubble = chatView.addAssistantBubble();

    inputBar.setDisabled(true);
    setStreaming(true);
    clearAttachments();

    let fullResponse = "";

    const currentChat = chatStore.get().activeChat;
    const history: ChatMessage[] = currentChat?.messages ?? [];

    await streamChat(
      fullPrompt,
      history,
      (chunk: string) => {
        if (chunk === "[DONE]") {
          inputBar.setDisabled(false);
          inputBar.focus();
          setStreaming(false);

          // Persist messages
          appendMessage({ role: "user", content: promptText });
          appendMessage({ role: "assistant", content: fullResponse });

          // Update header title
          const updatedState = chatStore.get();
          if (updatedState.activeChat) {
            header.setTitle(updatedState.activeChat.title);
          }
          return;
        }
        fullResponse += chunk;
        updateStreamingResponse(chunk);
        assistantBubble.updateContent(fullResponse);
        chatView.scrollToBottom();
      },
      (errorText: string) => {
        inputBar.setDisabled(false);
        setStreaming(false);
        assistantBubble.updateContent(
          `**Error:** ${errorText}\n\nPlease check your API Key & Settings.`,
        );
        chatView.scrollToBottom();
      },
    );
  }

  // ── Wire header actions ──
  header.onNewChat(handleNewChat);

  header.onHistory(() => {
    const panel = root.querySelector("#history-panel");
    if (panel?.classList.contains("hidden")) {
      historyPanel.show();
    } else {
      historyPanel.hide();
    }
  });

  header.onClear(() => {
    clearActiveChat();
    renderActiveChat();
  });

  header.onSettings(() => {
    const settingsPanel = createSettingsPanel(() => {
      void loadSettings().then((cfg) => {
        header.setModel(cfg.model || "gpt-4o-mini");
      });
    });
    root.appendChild(settingsPanel);
  });

  return root;
}
