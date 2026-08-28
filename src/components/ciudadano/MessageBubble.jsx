import ChatBotAvatar from "../ChatBotAvatar";

export default function MessageBubble({ message, speaking = false, typedText = "", reaction = "idle" }) {
  const isBot = message.type === "bot";
  const shown = speaking ? typedText || message.text : message.text;
  const typing = speaking && typedText.length < message.text.length;

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
              <span className="inline-block w-[2px] h-[1.05em] -mb-[2px] ml-0.5 bg-brand-deep align-middle animate-pulse-soft" />
            )}
          </p>
        </div>
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
