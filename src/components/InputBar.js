import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriEnv } from "../services/settings.js";

export function createInputBar(onSend, onInputCallback = null) {
  const container = document.createElement("div");
  container.className = "w-full p-2.5 px-3 bg-neutral-100/80 dark:bg-neutral-900/80 border-t border-neutral-200/50 dark:border-neutral-800/80 backdrop-blur-md flex items-end gap-2 shrink-0";

  container.innerHTML = `
    <!-- Textarea Input Container -->
    <div class="relative flex-1 bg-white dark:bg-neutral-800/90 border border-neutral-300/60 dark:border-neutral-700/60 rounded-xl shadow-inner focus-within:border-black dark:focus-within:border-white transition-colors flex items-center min-h-[36px]">
      <textarea
        id="prompt-input"
        rows="1"
        placeholder="Ask KAI anything... (Press Enter to send)"
        class="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none max-h-28 leading-snug h-[36px]"
      ></textarea>
    </div>

    <!-- Send Button -->
    <button
      id="send-btn"
      disabled
      class="h-9 w-9 bg-black dark:bg-white text-white dark:text-black rounded-xl opacity-40 cursor-not-allowed hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center shrink-0"
      title="Send Message"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
    </button>
  `;

  const textarea = container.querySelector("#prompt-input");
  const sendBtn = container.querySelector("#send-btn");

  const updateState = () => {
    const value = textarea.value;
    const hasText = value.trim().length > 0;
    sendBtn.disabled = !hasText;
    if (hasText) {
      sendBtn.classList.remove("opacity-40", "cursor-not-allowed");
    } else {
      sendBtn.classList.add("opacity-40", "cursor-not-allowed");
    }
  };

  const autoResize = () => {
    textarea.style.height = "36px";
    textarea.style.height = Math.max(36, Math.min(textarea.scrollHeight, 112)) + "px";
  };

  // Listener for when user types in the input
  textarea.addEventListener("input", (e) => {
    autoResize();
    updateState();
    if (typeof onInputCallback === "function") {
      onInputCallback(e.target.value, e);
    }
  });

  const submit = () => {
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = "";
    autoResize();
    updateState();
    onSend(text);
  };

  sendBtn.addEventListener("click", submit);

  textarea.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (isTauriEnv()) {
        try {
          const win = getCurrentWindow();
          await win.hide();
        } catch (err) {
          console.warn("Could not hide window via escape:", err);
        }
      }
    }
  });

  // Auto-focus when window gains focus or mounts
  window.addEventListener("focus", () => {
    setTimeout(() => textarea.focus(), 30);
  });

  setTimeout(() => textarea.focus(), 50);

  return {
    element: container,
    focus: () => textarea.focus(),
    setDisabled: (disabled) => {
      textarea.disabled = disabled;
      sendBtn.disabled = disabled || textarea.value.trim().length === 0;
    },
    onInput: (fn) => {
      onInputCallback = fn;
    }
  };
}


