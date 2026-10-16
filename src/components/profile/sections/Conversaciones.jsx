import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileData } from "../useProfileData";
import { SectionHeader, EmptyNote, Icon, ICONS, Pill } from "../ui";
import { formatDateTime, timeAgo } from "../../../utils/date";

function firstUserText(messages) {
  const first = messages.find((m) => m.type === "user");
  return first?.text || messages[0]?.text || "Conversación con ChatAP";
}

export default function Conversaciones() {
  const data = useProfileData();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);

  if (!data) return null;
  const sessions = data.chatSessions;

  return (
    <div>
      <SectionHeader
        title="Mis conversaciones"
        description="Tu historial de consultas con ChatAP, agrupado por sesión."
      />
      {sessions.length === 0 ? (
        <div className="card card-border">
          <EmptyNote
            icon={<Icon path={ICONS.chat} className="w-10 h-10 mx-auto" />}
            title="Todavía no conversaste con ChatAP"
            description="Cuando inicies una consulta, tu historial va a aparecer acá para que puedas retomarlo."
            action={<button className="btn-primary text-[13px]!" onClick={() => navigate("/chat")}>Chatear con ChatAP</button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => {
            const expanded = openId === i;
            const preview = firstUserText(s.messages);
            const last = s.messages[s.messages.length - 1];
            return (
              <button
                key={i}
                onClick={() => setOpenId(expanded ? null : i)}
                className="card card-interactive w-full p-4 text-left cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-ok/10 text-ok">
                      <Icon path={ICONS.chat} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink m-0 truncate">{preview}</p>
                      <p className="text-[11px] text-faint m-0">
                        {s.messages.length} mensaje{s.messages.length === 1 ? "" : "s"} · iniciada {timeAgo(s.messages[0].timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Pill tone="bg-mist text-muted border border-line">
                      {formatDateTime(last?.timestamp)}
                    </Pill>
                    <span className="text-faint transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "none" }}>
                      ▾
                    </span>
                  </div>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-2.5 border-t border-line pt-4">
                    {s.messages.slice(-12).map((m) => (
                      <div
                        key={m.id}
                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          m.type === "user"
                            ? "bg-brand-deep text-paper ml-auto rounded-br-sm"
                            : m.type === "action"
                            ? "bg-mist text-ink border border-line mx-auto text-center text-xs rounded-full max-w-full"
                            : "bg-mist text-ink rounded-bl-sm"
                        }`}
                      >
                        {m.type === "action" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand mr-2" />}
                        {m.text}
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-[11px] text-faint m-0">Última actividad {timeAgo(last?.timestamp)}</p>
                      <button
                        className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                        onClick={() => navigate("/chat")}
                      >
                        Continuar conversación
                      </button>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}