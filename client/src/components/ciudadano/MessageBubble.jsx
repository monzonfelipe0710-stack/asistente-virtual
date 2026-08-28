import ChatBotAvatar from "../ChatBotAvatar";

export default function MessageBubble({ message, speaking = false, typedText = "", reaction = "idle" }) {
  const isBot = message.type === "bot";
  const shown = speaking ? typedText || message.text : message.text;
  const typing = speaking && typedText.length < message.text.length;

  function downloadTemplate() {
    const blob = new Blob([message.action.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = message.action.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"} animate-fade-up`}>
      {isBot && (
        <ChatBotAvatar
          reaction={speaking ? reaction : "idle"}
          size={30}
          static={!speaking}
          speaking={speaking}
        />
      )}
      <div className="max-w-[80%] sm:max-w-[70%]">
        <div
          className={`px-4 py-3 text-sm leading-relaxed rounded-2xl ${
            isBot
              ? "bg-mist text-ink border border-line rounded-tl-sm"
              : "bg-brand-deep text-paper rounded-tr-sm"
          }`}
        >
          <p className="m-0 whitespace-pre-wrap">
            {shown}
            {typing && (
              <span className="inline-block w-0.5 h-[1.05em] -mb-0.5 ml-0.5 bg-brand-deep align-middle animate-pulse-soft" />
            )}
          </p>
        </div>
        {!typing && message.action?.type === "download" && (
          <button type="button" onClick={downloadTemplate} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-deep px-3 py-2 text-xs font-semibold text-paper transition-colors hover:bg-brand">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
            {message.action.label}
          </button>
        )}
        {!typing && message.action?.type === "location" && (
          <div className="mt-2 rounded-xl border border-line bg-paper p-3 text-xs text-ink shadow-sm">
            <p className="m-0 font-semibold">{message.action.place}</p>
            <p className="m-0 mt-1 text-muted">{message.action.address}</p>
            <p className="m-0 mt-1 text-muted">{message.action.hours}</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(message.action.place)}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-deep hover:underline">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z" /><circle cx="12" cy="9" r="2.2" /></svg>
              {message.action.label}
            </a>
          </div>
        )}
        <span
          className={`block text-[10px] uppercase tracking-wide mt-1 ${
            isBot ? "text-muted text-left" : "text-muted text-right"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
