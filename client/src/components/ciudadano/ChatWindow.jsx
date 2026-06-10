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
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_-25px_rgba(15,23,42,0.35)]">
      <div className="bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 px-4 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 shadow-inner">
            <span className="text-sm font-black tracking-[0.25em] text-white">AP</span>
          </div>
          <div>
            <h2 className="m-0 text-sm font-semibold">ChatAP</h2>
            <p className="m-0 text-[11px] text-blue-100">Asistente Virtual · Atención digital</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] text-blue-100 ring-1 ring-inset ring-emerald-300/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            En línea
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-slate-50">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <QuickReplies onSelect={handleQuickReply} />

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu consulta..."
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
          aria-label="Mensaje"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 bg-blue-800 text-white text-sm rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
