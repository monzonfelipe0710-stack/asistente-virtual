export default function MessageBubble({ message }) {
  const isBot = message.type === "bot";

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-2.5 animate-fade-in`}>
      {isBot && (
        <div className="w-7 h-7 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center flex-shrink-0 mt-1 mr-2 shadow-sm">
          <span className="text-white font-bold text-[9px]">AP</span>
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isBot
            ? "bg-white border border-slate-200/60 text-slate-700 rounded-bl-md shadow-sm"
            : "bg-gradient-to-br from-primary to-primary-light text-white rounded-br-md shadow-md shadow-blue-900/10"
        }`}
      >
        <p className="m-0 whitespace-pre-wrap">{message.text}</p>
        <span
          className={`block text-[10px] mt-1.5 font-medium ${
            isBot ? "text-slate-400" : "text-white/60"
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
