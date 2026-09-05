import ChatBotAvatar from "../ChatBotAvatar";

function DownloadButton({ action }) {
  function downloadTemplate() {
    const blob = new Blob([action.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = action.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={downloadTemplate} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-deep px-3 py-2 text-xs font-semibold text-paper transition-colors hover:bg-brand">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
      {action.label}
    </button>
  );
}

function LocationCard({ action }) {
  return (
    <div className="mt-2 rounded-xl border border-line bg-paper p-3 text-xs text-ink shadow-sm">
      <p className="m-0 font-semibold">{action.place}</p>
      <p className="m-0 mt-1 text-muted">{action.address}</p>
      <p className="m-0 mt-1 text-muted">{action.hours}</p>
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.place)}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-semibold text-brand-deep hover:underline">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12z" /><circle cx="12" cy="9" r="2.2" /></svg>
        {action.label}
      </a>
    </div>
  );
}

function Chips({ action, onFollowUp }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {action.title && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {action.title}
        </span>
      )}
      {action.options.map((opt) => (
        <button
          key={opt.value || opt.label}
          type="button"
          onClick={() => onFollowUp?.(opt.value ?? opt.label)}
          className="bubble-chip"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function WizardStart({ action, onFollowUp }) {
  return (
    <button
      type="button"
      onClick={() => onFollowUp?.({ type: "wizard", wizardId: action.wizardId, label: action.label })}
      className="bubble-wizard"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {action.label}
    </button>
  );
}

export default function MessageBubble({ message, speaking = false, typedText = "", reaction = "idle", onFollowUp }) {
  const isBot = message.type === "bot";
  const shown = speaking ? typedText || message.text : message.text;
  const typing = speaking && typedText.length < message.text.length;

  const actionList = Array.isArray(message.actions)
    ? message.actions
    : message.action
      ? [message.action]
      : [];

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
        {!typing &&
          actionList.map((action, index) => {
            if (action.type === "chips") {
              return <Chips key={index} action={action} onFollowUp={onFollowUp} />;
            }
            if (action.type === "wizard") {
              return <WizardStart key={index} action={action} onFollowUp={onFollowUp} />;
            }
            if (action.type === "download") {
              return <DownloadButton key={index} action={action} />;
            }
            if (action.type === "location") {
              return <LocationCard key={index} action={action} />;
            }
            return null;
          })}
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