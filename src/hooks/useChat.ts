import { useState, useRef, useCallback } from "react";
import { FlatList } from "react-native";
import { ChatMessage, initialMessages, findResponse } from "../data/mockMessages";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = useCallback(() => {
    // Small delay to allow render before scrolling
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const addMessage = useCallback((type: "user" | "bot", text: string) => {
    const msg: ChatMessage = {
      id: Date.now(),
      type,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const simulateBotResponse = useCallback(
    (userText: string) => {
      setIsTyping(true);
      const delay = 800 + Math.random() * 1200;
      setTimeout(() => {
        const response = findResponse(userText);
        addMessage("bot", response);
        setIsTyping(false);
        scrollToBottom();
      }, delay);
    },
    [addMessage, scrollToBottom]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    addMessage("user", text);
    setInput("");
    scrollToBottom();
    simulateBotResponse(text);
  }, [input, addMessage, simulateBotResponse, scrollToBottom]);

  const handleQuickReply = useCallback(
    (query: string) => {
      addMessage("user", query);
      scrollToBottom();
      simulateBotResponse(query);
    },
    [addMessage, simulateBotResponse, scrollToBottom]
  );

  return {
    messages,
    input,
    setInput,
    isTyping,
    listRef,
    handleSend,
    handleQuickReply,
    scrollToBottom,
  };
}