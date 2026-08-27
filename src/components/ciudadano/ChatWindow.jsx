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
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

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
    setTimeout(() => {
      const response = findResponse(userText);
      addMessage("bot", response);
      setIsTyping(false);
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

  return (
    <div className="flex flex-col h-full bg-paper border border-line">
      <div className="bg-brand px-5 py-4 flex items-center gap-3 animate-fade-in">
        <div className="w-9 h-9 bg-paper flex items-center justify-center">
          <span className="text-ink font-bold text-xs tracking-wide">AP</span>
        </div>
        <div className="leading-none">
          <h2 className="text-sm font-bold uppercase tracking-wider text-paper m-0">
            ChatAP
          </h2>
          <p className="text-[10px] uppercase tracking-wide text-muted mt-1 m-0">
            Asistente Virtual
          </p>
        </div>
        <span className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-wide text-paper">
          <span className="w-1.5 h-1.5 bg-ok rounded-full inline-block animate-pulse-soft" />
          En línea
        </span>
      </div>

      <div ref={messagesRef} className="flex-1 overflow-y-auto px-5 py-5 bg-paper">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-4 animate-fade-up">
            <div className="bg-mist px-4 py-3 border border-line">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <QuickReplies onSelect={handleQuickReply} />

      <form onSubmit={handleSend} className="flex items-stretch border-t border-line">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu consulta..."
          className="flex-1 px-4 py-4 text-sm border-0 outline-none bg-paper text-ink placeholder:text-muted focus:ring-0"
          aria-label="Mensaje"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-6 bg-brand text-paper text-xs font-bold uppercase tracking-wide hover:bg-brand-dark transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
