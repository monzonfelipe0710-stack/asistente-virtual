import ChatBotAvatar from "../ChatBotAvatar";
import StatusIndicator from "./StatusIndicator";

export default function ChatPreview({ className = "", avatarSize = 92 }) {
  return (
    <div className={`panel-tech flex flex-col ${className}`}>
      {/* Cabecera del panel */}
      <div className="flex items-center gap-4 border-b border-line px-5 py-4">
        <div className="relative shrink-0">
          <div className="grid h-14 w-14 place-items-center border border-line bg-mist/40">
            <ChatBotAvatar size={avatarSize} reaction="idle" followMouse={false} />
          </div>
          <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-[#18bc42] border border-paper" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 font-neue text-sm font-extrabold tracking-tight text-ink uppercase">
            ChatAP<span className="text-brand">.</span>
          </p>
          <p className="m-0 mt-0.5 text-[10px] font-mono uppercase tracking-[0.22em] text-faint">
            Asistente virtual
          </p>
        </div>
        <StatusIndicator label="Online" tone="ok" />
      </div>

      {/* Conversación */}
      <div className="flex flex-1 flex-col gap-3 px-5 py-6">
        <div className="max-w-[85%] self-start border border-line bg-mist/50 px-4 py-3">
          <p className="m-0 text-sm leading-relaxed text-ink">
            ¿En qué puedo ayudarte hoy?
          </p>
        </div>
        <div className="max-w-[85%] self-end bg-brand px-4 py-3">
          <p className="m-0 text-sm leading-relaxed text-[#171717] font-medium">
            Quiero realizar un trámite
          </p>
        </div>
        <div className="max-w-[85%] self-start border border-line bg-mist/50 px-4 py-3">
          <p className="m-0 text-sm leading-relaxed text-ink">
            Claro. ¿Qué trámite estás buscando? Te muestro opciones al instante.
          </p>
          <span className="mt-3 inline-flex items-end gap-[3px] h-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="wave-bar w-[3px] h-3 rounded-full bg-brand-deep/70" />
            ))}
          </span>
        </div>
      </div>

      {/* Input simulado */}
      <div className="border-t border-line px-5 py-4">
        <div className="flex items-center justify-between gap-3 border border-line bg-paper px-4 py-3">
          <span className="text-xs font-mono uppercase tracking-wider text-faint">
            Escribí tu consulta…
          </span>
          <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}