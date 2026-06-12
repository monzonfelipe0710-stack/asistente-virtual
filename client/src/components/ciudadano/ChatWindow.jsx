import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import QuickReplies from "./QuickReplies";
import { initialMessages, botResponses } from "../../data/mockMessages";

function findResponse(input) {
  const text = input.toLowerCase();
  for (const entry of botResponses) {
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        return entry.response;
      }
    }
  }
  return botResponses.find((e) => e.keywords.includes("default")).response;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("chatap_messages");
      return saved ? JSON.parse(saved) : initialMessages;
    } catch {
      return initialMessages;
    }
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const typingRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    try {
      localStorage.setItem("chatap_messages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, []);

  function addMessage(type, text) {
    const msg = {
      id: Date.now(),
      type,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }

  function simulateBotResponse(userText) {
    setIsTyping(true);
    const delay = 800 + Math.random() * 1200;
    typingRef.current = setTimeout(() => {
      const response = findResponse(userText);
      addMessage("bot", response);
      setIsTyping(false);
      typingRef.current = null;
    }, delay);
  }

  function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    addMessage("user", text);
    setInput("");
    simulateBotResponse(text);
  }

  function handleQuickReply(query) {
    addMessage("user", query);
    setInput("");
    simulateBotResponse(query);
  }

  function clearChat() {
    setMessages(initialMessages);
    try {
      localStorage.removeItem("chatap_messages");
    } catch {}
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden border border-slate-200/60">
      <div className="bg-gradient-to-r from-primary to-primary-light px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center ring-1 ring-white/20">
          <span className="text-white font-semibold text-xs">AP</span>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white m-0 tracking-tight">ChatAP</h2>
          <p className="text-[11px] text-white/70 m-0 font-medium">Asistente Virtual</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={clearChat}
            title="Limpiar conversación"
            className="text-white/50 hover:text-white/90 transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <span className="flex items-center gap-1.5 text-[11px] text-white/70 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            En línea
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5 bg-gradient-to-b from-slate-50/80 to-white/50 stagger-children" style={{ overscrollBehavior: "contain" }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3 animate-fade-in">
            <div className="bg-white border border-slate-200/60 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse-dot" style={{ animationDelay: "0s" }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <QuickReplies onSelect={handleQuickReply} />

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu consulta..."
          className="input-field flex-1"
          aria-label="Mensaje"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-primary flex items-center justify-center !px-3.5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
