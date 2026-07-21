import { attachmentStore, removeAttachment } from "../stores/attachmentStore";
import { formatFileSize } from "../utils/format";
import type { Attachment } from "../types/attachments";

function getTypeIcon(type: string): string {
  switch (type) {
    case "image":
      return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
    case "pdf":
      return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>`;
    default:
      return `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`;
  }
}

function createAttachmentItem(attachment: Attachment): HTMLElement {
  const item = document.createElement("div");
  item.className =
    "flex items-center gap-2 px-2.5 py-1.5 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-lg border border-neutral-300/50 dark:border-neutral-700/50 text-xs max-w-[180px] group animate-pop-in";
  item.setAttribute("data-attachment-id", attachment.id);

  const statusClass =
    attachment.status === "reading"
      ? "animate-pulse opacity-60"
      : attachment.status === "error"
        ? "text-red-500"
        : "";

  item.innerHTML = `
    <span class="text-neutral-500 dark:text-neutral-400 shrink-0 ${statusClass}">
      ${attachment.type === "image" && attachment.preview ? `<img src="${attachment.preview}" class="w-6 h-6 rounded object-cover" alt="${attachment.name}">` : getTypeIcon(attachment.type)}
    </span>
    <span class="truncate text-neutral-700 dark:text-neutral-300 flex-1" title="${attachment.name}">
      ${attachment.name}
    </span>
    <span class="text-neutral-400 shrink-0">${formatFileSize(attachment.size)}</span>
    <button class="remove-attachment opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-all shrink-0 p-0.5 rounded hover:bg-red-500/10" title="Remover">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  const removeBtn = item.querySelector(".remove-attachment");
  removeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    removeAttachment(attachment.id);
  });

  return item;
}

export interface AttachmentBarAPI {
  element: HTMLElement;
  destroy: () => void;
}

export function createAttachmentBar(): AttachmentBarAPI {
  const container = document.createElement("div");
  container.id = "attachment-bar";
  container.className =
    "hidden flex-wrap gap-1.5 px-3 py-2 border-t border-neutral-200/50 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50";

  const unsubscribe = attachmentStore.subscribe((state) => {
    if (state.attachments.length === 0) {
      container.classList.add("hidden");
      container.innerHTML = "";
      return;
    }

    container.classList.remove("hidden");
    container.innerHTML = "";
    for (const att of state.attachments) {
      container.appendChild(createAttachmentItem(att));
    }
  });

  return {
    element: container,
    destroy: unsubscribe,
  };
}
