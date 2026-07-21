const CHATS_STORAGE_KEY = "kai_chat_sessions";
const ACTIVE_CHAT_KEY = "kai_active_chat_id";

export function getSavedChats() {
  try {
    const raw = localStorage.getItem(CHATS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Failed to load chats:", e);
    return [];
  }
}

export function saveChats(chats) {
  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  } catch (e) {
    console.warn("Failed to save chats:", e);
  }
}

export function getActiveChatId() {
  try {
    return localStorage.getItem(ACTIVE_CHAT_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function setActiveChatId(id) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CHAT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  } catch (e) {}
}

export function createNewChatSession() {
  const newChat = {
    id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: "Nova conversa",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  };
  const chats = getSavedChats();
  chats.unshift(newChat);
  saveChats(chats);
  setActiveChatId(newChat.id);
  return newChat;
}

export function getOrCreateActiveChat() {
  const chats = getSavedChats();
  const activeId = getActiveChatId();
  
  let current = chats.find((c) => c.id === activeId);
  if (!current) {
    if (chats.length > 0) {
      current = chats[0];
      setActiveChatId(current.id);
    } else {
      current = createNewChatSession();
    }
  }
  return current;
}

export function updateChatSession(chatId, messages) {
  const chats = getSavedChats();
  const index = chats.findIndex((c) => c.id === chatId);
  if (index === -1) return;

  const chat = chats[index];
  chat.messages = [...messages];
  chat.updatedAt = new Date().toISOString();

  // Generate title from first user message if title is default
  if (messages.length > 0 && (chat.title === "Nova conversa" || chat.title === "New Chat")) {
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      const text = firstUserMsg.content.trim();
      chat.title = text.length > 32 ? text.substring(0, 32) + "..." : text;
    }
  }

  // Move updated chat to top of list
  chats.splice(index, 1);
  chats.unshift(chat);

  saveChats(chats);
}

export function deleteChatSession(chatId) {
  let chats = getSavedChats();
  chats = chats.filter((c) => c.id !== chatId);
  saveChats(chats);
  if (getActiveChatId() === chatId) {
    setActiveChatId(chats.length > 0 ? chats[0].id : null);
  }
}
