import { invoke } from "@tauri-apps/api/core";
import type { ChatSession } from "../types/chat";
import { isTauriEnv } from "../utils/env";

const CHATS_KEY = "kai_chat_sessions";
const ACTIVE_KEY = "kai_active_chat_id";

function readChatsFromStorage(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeChatsToStorage(chats: ChatSession[]): void {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch {
    // silently fail
  }
}

export function getActiveChatId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveChatId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  } catch {
    // silently fail
  }
}

export async function loadChats(): Promise<ChatSession[]> {
  if (isTauriEnv()) {
    try {
      return await invoke<ChatSession[]>("load_chats");
    } catch {
      // fallback to localStorage
    }
  }
  return readChatsFromStorage();
}

export async function loadChat(id: string): Promise<ChatSession | null> {
  if (isTauriEnv()) {
    try {
      return await invoke<ChatSession | null>("load_chat", { id });
    } catch {
      // fallback
    }
  }
  const chats = readChatsFromStorage();
  return chats.find((c) => c.id === id) ?? null;
}

export async function saveChat(chat: ChatSession): Promise<void> {
  if (isTauriEnv()) {
    try {
      await invoke("save_chat", { chat });
      return;
    } catch {
      // fallback
    }
  }

  const chats = readChatsFromStorage();
  const idx = chats.findIndex((c) => c.id === chat.id);
  if (idx >= 0) {
    chats[idx] = chat;
  } else {
    chats.unshift(chat);
  }
  writeChatsToStorage(chats);
}

export async function deleteChat(id: string): Promise<void> {
  if (isTauriEnv()) {
    try {
      await invoke("delete_chat", { id });
      return;
    } catch {
      // fallback
    }
  }

  const chats = readChatsFromStorage().filter((c) => c.id !== id);
  writeChatsToStorage(chats);
  if (getActiveChatId() === id) {
    setActiveChatId(chats.length > 0 ? chats[0].id : null);
  }
}

export async function renameChat(
  id: string,
  title: string,
): Promise<void> {
  if (isTauriEnv()) {
    try {
      await invoke("rename_chat", { id, title });
      return;
    } catch {
      // fallback
    }
  }

  const chats = readChatsFromStorage();
  const chat = chats.find((c) => c.id === id);
  if (chat) {
    chat.title = title;
    writeChatsToStorage(chats);
  }
}

export async function searchChats(query: string): Promise<ChatSession[]> {
  if (isTauriEnv()) {
    try {
      return await invoke<ChatSession[]>("search_chats", { query });
    } catch {
      // fallback
    }
  }

  const chats = readChatsFromStorage();
  const lower = query.toLowerCase();
  return chats.filter(
    (c) =>
      c.title.toLowerCase().includes(lower) ||
      c.messages.some((m) => m.content.toLowerCase().includes(lower)),
  );
}

export function createChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
