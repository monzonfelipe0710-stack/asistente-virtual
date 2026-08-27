export default function MessageBubble({ message }) {
  const isBot = message.type === "bot";

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
          isBot
            ? "bg-paper text-ink border border-line"
            : "bg-ink text-paper"
        }`}
      >
        <p className="m-0 whitespace-pre-wrap">{message.text}</p>
        <span
          className={`block text-[10px] uppercase tracking-wide mt-2 ${
            isBot ? "text-muted" : "text-muted"
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
