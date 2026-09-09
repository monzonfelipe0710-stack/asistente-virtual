import ChatBotAvatar from "../ChatBotAvatar";
import StatusIndicator from "./StatusIndicator";

/**
 * ChatPreview — terminal-style mock chat UI.
 *
 * Fixes vs previous version:
 * - Avatar container is now sized to match `avatarSize` exactly (no overflow clipping).
 * - `followMouse={false}` on the preview avatar — it auto-reacts but doesn't track
 *   the cursor (that would feel invasive inside a small mock window).
 * - `overflow-visible` on the avatar wrapper so the blob's subtle deformations
 *   don't get clipped by the square container border.
 */
export default function ChatPreview({ className = "", avatarSize = 72, dark = false }) {
  const ink      = dark ? "text-[#f1eee7]" : "text-ink";
  const muted    = dark ? "text-white/45"   : "text-faint";
  const bubble   = dark ? "border border-white/10 bg-white/5" : "border border-line bg-mist/50";
  const userBubble = dark ? "bg-brand text-[#232323]" : "bg-brand text-[#171717]";

  /* Container size slightly larger than avatar so deformations aren't clipped */
  const wrap = avatarSize + 8;

  return (
    <div className={`flex flex-col ${dark ? "bg-[#0a0a0a] text-white" : "panel-tech"} ${className}`}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-4 border-b ${dark ? "border-white/10" : "border-line"} px-5 py-4`}>
        <div className="relative shrink-0">
          {/* Avatar container — sized to the avatar, overflow visible */}
          <div
            className={`relative grid place-items-center overflow-visible ${
              dark ? "border border-white/15 bg-white/[0.03]" : "border border-line bg-mist/40"
            }`}
            style={{ width: wrap, height: wrap }}
          >
            <ChatBotAvatar
              size={avatarSize}
              reaction="idle"
              followMouse={false}
            />
          </div>
          {/* Online dot */}
          <span
            className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-[#18bc42] border-2 border-[#0a0a0a]"
            aria-hidden="true"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`m-0 font-neue text-sm font-medium tracking-tight uppercase ${ink}`}>ChatAP</p>
          <p className={`m-0 mt-0.5 text-[10px] font-mono uppercase tracking-[0.22em] ${muted}`}>
            Asistente virtual
          </p>
        </div>

        <StatusIndicator label="Online" tone="ok" light={dark} />
      </div>

      {/* ── Messages ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 px-5 py-6 min-h-[16rem]">
        <div className={`max-w-[85%] self-start px-4 py-3 ${bubble}`}>
          <p className={`m-0 text-sm leading-relaxed ${ink}`}>¿En qué puedo ayudarte hoy?</p>
        </div>

        <div className={`max-w-[85%] self-end px-4 py-3 ${userBubble}`}>
          <p className="m-0 text-sm leading-relaxed font-medium">Quiero realizar un trámite</p>
        </div>

        <div className={`max-w-[85%] self-start px-4 py-3 ${bubble}`}>
          <p className={`m-0 text-sm leading-relaxed ${ink}`}>
            Claro. ¿Qué trámite estás buscando? Te muestro opciones al instante.
          </p>
          {/* Animated sound-wave bars */}
          <span className="mt-3 inline-flex items-end gap-[3px] h-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="wave-bar w-[3px] h-3 rounded-full bg-brand/80" />
            ))}
          </span>
        </div>
      </div>

      {/* ── Input bar ─────────────────────────────────────────────── */}
      <div className={`border-t ${dark ? "border-white/10" : "border-line"} px-5 py-4`}>
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 ${
            dark ? "border border-white/10 bg-[#111]" : "border border-line bg-paper"
          }`}
        >
          <span className={`text-xs font-mono uppercase tracking-wider ${muted}`}>
            Escribí tu consulta…
          </span>
          <span className="terminal-caret" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
