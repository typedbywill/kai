import { createStore } from "./createStore";
import type { Attachment } from "../types/attachments";
import {
  resolveAttachmentType,
  MAX_ATTACHMENT_SIZE,
} from "../types/attachments";

interface AttachmentState {
  attachments: Attachment[];
}

const initialState: AttachmentState = {
  attachments: [],
};

export const attachmentStore = createStore<AttachmentState>(initialState);

function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export function addAttachment(file: File): Attachment | null {
  if (file.size > MAX_ATTACHMENT_SIZE) {
    console.warn(
      `File "${file.name}" exceeds max size (${MAX_ATTACHMENT_SIZE} bytes)`,
    );
    return null;
  }

  const type = resolveAttachmentType(file.type, file.name);
  if (type === "unknown") {
    console.warn(`Unsupported file type: ${file.type} (${file.name})`);
    return null;
  }

  const attachment: Attachment = {
    id: generateId(),
    name: file.name,
    size: file.size,
    type,
    mimeType: file.type,
    status: "pending",
  };

  const state = attachmentStore.get();
  attachmentStore.set({ attachments: [...state.attachments, attachment] });

  // Read file content asynchronously
  void readFileContent(attachment, file);

  return attachment;
}

async function readFileContent(
  attachment: Attachment,
  file: File,
): Promise<void> {
  updateAttachment(attachment.id, { status: "reading" });

  try {
    if (attachment.type === "image") {
      // Read as base64 for images
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const content = `data:${file.type};base64,${base64}`;
      updateAttachment(attachment.id, {
        status: "ready",
        content,
        preview: content,
      });
    } else {
      // Read as text for text-based files
      const content = await file.text();
      updateAttachment(attachment.id, { status: "ready", content });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to read file";
    updateAttachment(attachment.id, { status: "error", error: message });
  }
}

function updateAttachment(
  id: string,
  updates: Partial<Attachment>,
): void {
  const state = attachmentStore.get();
  const attachments = state.attachments.map((a) =>
    a.id === id ? { ...a, ...updates } : a,
  );
  attachmentStore.set({ attachments });
}

export function removeAttachment(id: string): void {
  const state = attachmentStore.get();
  attachmentStore.set({
    attachments: state.attachments.filter((a) => a.id !== id),
  });
}

export function clearAttachments(): void {
  attachmentStore.set({ attachments: [] });
}

export function getReadyAttachments(): Attachment[] {
  return attachmentStore.get().attachments.filter((a) => a.status === "ready");
}
