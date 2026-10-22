export default function MessageBubble({ message }) {
  const isBot = message.type === "bot";

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-3`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isBot
            ? "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
            : "bg-blue-800 text-white rounded-br-md"
        }`}
      >
        <p className="m-0 whitespace-pre-wrap">{message.text}</p>
        <span
          className={`block text-[10px] mt-1.5 ${
            isBot ? "text-slate-400" : "text-blue-200"
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
