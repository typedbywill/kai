export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  attachments?: ChatAttachmentRef[];
}

export interface ChatAttachmentRef {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface StreamingState {
  isStreaming: boolean;
  currentResponse: string;
}
