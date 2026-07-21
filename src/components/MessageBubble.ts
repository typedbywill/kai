import { renderMarkdown } from "../services/markdown";
import type { ChatRole } from "../types/chat";

export interface MessageBubbleAPI {
  element: HTMLElement;
  updateContent: (content: string) => void;
}

export function createMessageBubble(
  role: ChatRole,
  content = "",
): MessageBubbleAPI {
  const wrapper = document.createElement("div");
  const isUser = role === "user";

  wrapper.className = `flex w-full ${isUser ? "justify-end" : "justify-start"} mb-3 animate-pop-in`;

  const bubble = document.createElement("div");
  if (isUser) {
    bubble.className =
      "max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md text-sm leading-relaxed font-normal whitespace-pre-wrap break-words";
    bubble.textContent = content;
  } else {
    bubble.className =
      "max-w-[96%] rounded-2xl rounded-tl-sm px-4 py-3 bg-neutral-100 dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm text-sm markdown-body break-words";
    if (!content) {
      bubble.innerHTML = `
        <div class="flex items-center gap-1.5 py-1 text-neutral-400">
          <span class="w-1.5 h-1.5 rounded-full bg-current pulse-dot-1"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-current pulse-dot-2"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-current pulse-dot-3"></span>
        </div>
      `;
    } else {
      bubble.innerHTML = renderMarkdown(content);
    }
  }

  wrapper.appendChild(bubble);

  return {
    element: wrapper,
    updateContent: (newContent: string) => {
      if (!isUser) {
        bubble.innerHTML = renderMarkdown(newContent);
      } else {
        bubble.textContent = newContent;
      }
    },
  };
}
