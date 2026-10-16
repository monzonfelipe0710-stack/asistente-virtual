type MessageType = "bot" | "user";

export interface ChatMessage {
  id: number;
  type: MessageType;
  text: string;
  timestamp: string;
}
