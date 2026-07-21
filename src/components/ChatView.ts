import { createMessageBubble, type MessageBubbleAPI } from "./MessageBubble";
import { chatStore } from "../stores/chatStore";

export interface ChatViewAPI {
  element: HTMLElement;
  scrollToBottom: () => void;
  addUserMessage: (content: string) => void;
  addAssistantBubble: () => MessageBubbleAPI;
  destroy: () => void;
}

export function createChatView(): ChatViewAPI {
  const container = document.createElement("div");
  container.id = "chat-view";
  container.className =
    "flex-1 overflow-y-auto p-4 flex flex-col gap-2 scroll-smooth";

  const renderWelcome = (): void => {
    container.innerHTML = `
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

  const renderMessages = (): void => {
    const state = chatStore.get();
    const chat = state.activeChat;

    if (!chat || chat.messages.length === 0) {
      renderWelcome();
      return;
    }

    container.innerHTML = "";
    for (const msg of chat.messages) {
      const bubble = createMessageBubble(msg.role, msg.content);
      container.appendChild(bubble.element);
    }

    scrollToBottom();
  };

  const scrollToBottom = (): void => {
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  };

  // Subscribe to chat store for re-renders when switching chats
  const unsubscribe = chatStore.subscribe(() => {
    // Only re-render on chat switch, not during streaming
    // (streaming is handled by addAssistantBubble/updateContent)
  });

  // Initial render
  renderMessages();

  return {
    element: container,
    scrollToBottom,

    addUserMessage: (content: string) => {
      // Clear welcome if present
      const welcome = container.querySelector("h2");
      if (welcome) {
        container.innerHTML = "";
      }

      const bubble = createMessageBubble("user", content);
      container.appendChild(bubble.element);
      scrollToBottom();
    },

    addAssistantBubble: (): MessageBubbleAPI => {
      const bubble = createMessageBubble("assistant", "");
      container.appendChild(bubble.element);
      scrollToBottom();
      return bubble;
    },

    destroy: unsubscribe,
  };
}
