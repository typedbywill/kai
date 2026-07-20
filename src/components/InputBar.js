import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriEnv } from "../services/settings.js";

export function createInputBar(onSend) {
  const container = document.createElement("div");
  container.className = "w-full p-3 bg-neutral-100/80 dark:bg-neutral-900/80 border-t border-neutral-200/50 dark:border-neutral-800/80 backdrop-blur-md flex items-end gap-2";

  container.innerHTML = `
    <div class="relative flex-1 bg-white dark:bg-neutral-800/90 border border-neutral-300/60 dark:border-neutral-700/60 rounded-2xl shadow-inner focus-within:border-neutral-400 dark:focus-within:border-neutral-500 transition-colors flex items-center">
      <textarea
        id="prompt-input"
        rows="1"
        placeholder="Ask KAI anything... (Press Enter to send, Esc to hide)"
        class="w-full bg-transparent px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none resize-none max-h-32 leading-relaxed"
      ></textarea>
    </div>
    <button
      id="send-btn"
      class="p-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center shrink-0"
      title="Send Message"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
    </button>
  `;

  const textarea = container.querySelector("#prompt-input");
  const sendBtn = container.querySelector("#send-btn");

  const autoResize = () => {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
  };

  textarea.addEventListener("input", autoResize);

  const submit = () => {
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = "";
    textarea.style.height = "auto";
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

  return {
    element: container,
    focus: () => textarea.focus(),
    setDisabled: (disabled) => {
      textarea.disabled = disabled;
      sendBtn.disabled = disabled;
    },
  };
}
