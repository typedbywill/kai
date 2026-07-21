import { createStore } from "./createStore";
import type { ChatSession } from "../types/chat";
import { loadChats, deleteChat, renameChat, searchChats } from "../ipc/history";

interface HistoryState {
  chats: ChatSession[];
  searchQuery: string;
  filteredChats: ChatSession[];
  isLoaded: boolean;
}

const initialState: HistoryState = {
  chats: [],
  searchQuery: "",
  filteredChats: [],
  isLoaded: false,
};

export const historyStore = createStore<HistoryState>(initialState);

export async function refreshHistory(): Promise<void> {
  const chats = await loadChats();
  const state = historyStore.get();
  const filteredChats = state.searchQuery
    ? chats.filter(
        (c) =>
          c.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          c.messages.some((m) =>
            m.content.toLowerCase().includes(state.searchQuery.toLowerCase()),
          ),
      )
    : chats;
  historyStore.set({ chats, filteredChats, isLoaded: true });
}

export async function searchHistory(query: string): Promise<void> {
  historyStore.set({ searchQuery: query });
  if (!query.trim()) {
    const state = historyStore.get();
    historyStore.set({ filteredChats: state.chats });
    return;
  }
  const results = await searchChats(query);
  historyStore.set({ filteredChats: results });
}

export async function removeChatFromHistory(id: string): Promise<void> {
  await deleteChat(id);
  await refreshHistory();
}

export async function renameChatInHistory(
  id: string,
  title: string,
): Promise<void> {
  await renameChat(id, title);
  await refreshHistory();
}
