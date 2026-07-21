import { createStore } from "./createStore";
import type { ChatSession, ChatMessage } from "../types/chat";
import {
  loadChats,
  saveChat,
  getActiveChatId,
  setActiveChatId,
  createChatId,
} from "../ipc/history";

interface ChatState {
  activeChat: ChatSession | null;
  isStreaming: boolean;
  currentResponse: string;
}

const initialState: ChatState = {
  activeChat: null,
  isStreaming: false,
  currentResponse: "",
};

export const chatStore = createStore<ChatState>(initialState);

export function createNewChat(): ChatSession {
  const chat: ChatSession = {
    id: createChatId(),
    title: "Nova conversa",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };

  setActiveChatId(chat.id);
  chatStore.set({ activeChat: chat, isStreaming: false, currentResponse: "" });

  // Save async — fire and forget
  void saveChat(chat);

  return chat;
}

export async function loadActiveChat(): Promise<void> {
  const chats = await loadChats();
  const activeId = getActiveChatId();

  let current = chats.find((c) => c.id === activeId) ?? null;
  if (!current && chats.length > 0) {
    current = chats[0];
  }
  if (!current) {
    current = createNewChat();
    return;
  }

  setActiveChatId(current.id);
  chatStore.set({ activeChat: current });
}

export function switchToChat(chat: ChatSession): void {
  setActiveChatId(chat.id);
  chatStore.set({ activeChat: chat, isStreaming: false, currentResponse: "" });
}

export function appendMessage(message: ChatMessage): void {
  const state = chatStore.get();
  if (!state.activeChat) return;

  const updated: ChatSession = {
    ...state.activeChat,
    messages: [...state.activeChat.messages, message],
    updatedAt: new Date().toISOString(),
  };

  // Auto-title from first user message
  if (
    updated.messages.length <= 2 &&
    (updated.title === "Nova conversa" || updated.title === "New Chat")
  ) {
    const firstUser = updated.messages.find((m) => m.role === "user");
    if (firstUser) {
      const text = firstUser.content.trim();
      updated.title =
        text.length > 32 ? text.substring(0, 32) + "..." : text;
    }
  }

  chatStore.set({ activeChat: updated });
  void saveChat(updated);
}

export function clearActiveChat(): void {
  const state = chatStore.get();
  if (!state.activeChat) return;

  const cleared: ChatSession = {
    ...state.activeChat,
    messages: [],
    updatedAt: new Date().toISOString(),
  };

  chatStore.set({ activeChat: cleared, isStreaming: false, currentResponse: "" });
  void saveChat(cleared);
}

export function setStreaming(isStreaming: boolean, currentResponse = ""): void {
  chatStore.set({ isStreaming, currentResponse });
}

export function updateStreamingResponse(chunk: string): void {
  const state = chatStore.get();
  chatStore.set({ currentResponse: state.currentResponse + chunk });
}
