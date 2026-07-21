import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAutoResize } from "../hooks/useAutoResize";
import { useDragDrop } from "../hooks/useDragDrop";
import { addAttachment } from "../stores/attachmentStore";
import { SUPPORTED_EXTENSIONS } from "../types/attachments";
import { qs } from "../utils/dom";
import { isTauriEnv } from "../utils/env";

export interface InputBarAPI {
  element: HTMLElement;
  focus: () => void;
  setDisabled: (disabled: boolean) => void;
  destroy: () => void;
}

export function createInputBar(
  onSend: (text: string) => void,
): InputBarAPI {
  const container = document.createElement("div");
  container.className =
    "w-full p-2.5 px-3 bg-neutral-100/80 dark:bg-neutral-900/80 border-t border-neutral-200/50 dark:border-neutral-800/80 backdrop-blur-md flex items-end gap-2 shrink-0";

  container.innerHTML = `
    <!-- Attach Button -->
    <button
      id="attach-btn"
      class="h-9 w-9 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 rounded-xl transition-all flex items-center justify-center shrink-0"
      title="Anexar arquivo"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
    </button>

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

    <!-- Hidden File Input -->
    <input
      id="file-input"
      type="file"
      multiple
      accept="${SUPPORTED_EXTENSIONS.join(",")}"
      class="hidden"
    >
  `;

  const textarea = qs<HTMLTextAreaElement>(container, "#prompt-input");
  const sendBtn = qs<HTMLButtonElement>(container, "#send-btn");
  const attachBtn = qs<HTMLButtonElement>(container, "#attach-btn");
  const fileInput = qs<HTMLInputElement>(container, "#file-input");

  // Auto-resize textarea
  const autoResize = useAutoResize(textarea);

  // Update send button state
  const updateState = (): void => {
    const hasText = textarea.value.trim().length > 0;
    sendBtn.disabled = !hasText;
    if (hasText) {
      sendBtn.classList.remove("opacity-40", "cursor-not-allowed");
    } else {
      sendBtn.classList.add("opacity-40", "cursor-not-allowed");
    }
  };

  textarea.addEventListener("input", () => {
    updateState();
  });

  // Submit handler
  const submit = (): void => {
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = "";
    autoResize.resize();
    updateState();
    onSend(text);
  };

  sendBtn.addEventListener("click", submit);

  textarea.addEventListener("keydown", async (e: KeyboardEvent) => {
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

  // File attachment via button
  attachBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files) {
      for (const file of Array.from(fileInput.files)) {
        addAttachment(file);
      }
      fileInput.value = "";
    }
  });

  // Paste images
  textarea.addEventListener("paste", (e: ClipboardEvent) => {
    if (e.clipboardData?.files.length) {
      for (const file of Array.from(e.clipboardData.files)) {
        addAttachment(file);
      }
    }
  });

  // Drag & drop on the textarea container
  const dragDrop = useDragDrop(container, {
    onDrop: (files) => {
      for (const f of files) {
        addAttachment(f);
      }
    },
  });

  // Auto-focus
  window.addEventListener("focus", () => {
    setTimeout(() => textarea.focus(), 30);
  });
  setTimeout(() => textarea.focus(), 50);

  return {
    element: container,
    focus: () => textarea.focus(),
    setDisabled: (disabled: boolean) => {
      textarea.disabled = disabled;
      sendBtn.disabled = disabled || textarea.value.trim().length === 0;
    },
    destroy: () => {
      autoResize.destroy();
      dragDrop.destroy();
    },
  };
}
