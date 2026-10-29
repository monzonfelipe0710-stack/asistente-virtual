import ChatBotAvatar from "../ChatBotAvatar";
import { memo, useEffect, useRef, useState } from "react";
import { calificarConsulta } from "../../services/consultas";
import { apiErrorMessage } from "../../lib/api";

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
    <button type="button" onClick={downloadTemplate} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-brand-deep px-4 py-2.5 min-h-11 text-sm font-semibold text-paper transition-colors hover:bg-brand">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" /></svg>
      {action.label}
    </button>
  );
}

function LocationCard({ action }) {
  return (
    <div className="mt-2 rounded-xl border border-line bg-paper p-3 text-sm text-ink shadow-sm">
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
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
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

function ChecklistButton({ action, onChecklist }) {
  return (
    <button
      type="button"
      onClick={() => onChecklist?.(action)}
      className="mt-2 inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 min-h-11 text-sm font-semibold text-brand-deep transition-colors hover:bg-mist"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 5h11M8 10h11M8 15h6M4 5h.01M4 10h.01M4 15h.01M5 21h14a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v16a1 1 0 001 1z" />
      </svg>
      {action.label}
    </button>
  );
}

function renderInline(text, keyPrefix = "inline") {
  const parts = String(text).split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={keyPrefix + index} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//i.test(part)) {
      const cleanUrl = part.replace(/[.,;!?]+$/, "");
      return <a key={keyPrefix + index} href={cleanUrl} target="_blank" rel="noreferrer" className="font-medium text-brand-deep underline decoration-brand/40 underline-offset-2 break-words hover:decoration-brand">{cleanUrl}</a>;
    }
    return part;
  });
}

function FormattedAnswer({ text }) {
  const lines = String(text || "").split("\n");
  const blocks = [];
  let items = [];
  let kind = null;
  const flush = () => {
    if (!items.length) return;
    const Tag = kind === "ordered" ? "ol" : "ul";
    blocks.push(<Tag key={"list" + blocks.length} className={"my-3 space-y-2.5 pl-5 marker:text-brand-deep " + (kind === "ordered" ? "list-decimal" : "list-disc")}>{items.map((item, i) => <li key={i} className="pl-1 leading-7">{renderInline(item, "item" + i)}</li>)}</Tag>);
    items = []; kind = null;
  };
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      // Markdown permite líneas vacías entre elementos de una lista. No vaciamos
      // la lista si el siguiente elemento continúa con el mismo tipo, así el
      // navegador mantiene la numeración 1, 2, 3… en lugar de reiniciarla.
      let nextIndex = i + 1;
      while (nextIndex < lines.length && !lines[nextIndex].trim()) nextIndex++;
      const nextLine = (lines[nextIndex] || "").trim();
      const nextNumber = /^\d+[.)]\s+.+$/.test(nextLine);
      const nextBullet = /^[-•*]\s+.+$/.test(nextLine);
      const nextKind = nextNumber ? "ordered" : nextBullet ? "unordered" : null;
      if (items.length && nextKind === kind) return;
      flush();
      return;
    }
    const number = line.match(/^\d+[.)]\s+(.+)$/);
    const bullet = line.match(/^[-•*]\s+(.+)$/);
    if (number || bullet) {
      const next = number ? "ordered" : "unordered";
      if (kind && kind !== next) flush();
      kind = next;
      // El <ol> ya agrega su propio número visual. Quitar numeración duplicada
      // que algunos modelos incluyen dentro del texto de cada elemento.
      const itemText = (number || bullet)[1].replace(/^\d+[.)]\s+/, "");
      items.push(itemText);
      return;
    }
    flush();
    if (/^#{1,3}\s+/.test(line)) blocks.push(<h4 key={"heading" + i} className="mb-2 mt-4 text-base font-bold tracking-tight text-ink first:mt-0">{renderInline(line.replace(/^#{1,3}\s+/, ""), "heading" + i)}</h4>);
    else blocks.push(<p key={"paragraph" + i} className="my-2 leading-7 text-[0.9375rem] first:mt-0 last:mb-0">{renderInline(line, "paragraph" + i)}</p>);
  });
  flush();
  return <div className="chat-answer-content">{blocks}</div>;
}
const OTRO_MOTIVO = "Otro motivo";
const MOTIVOS_NO_UTIL = [
  "No respondió mi pregunta",
  "La información no es correcta",
  "La respuesta fue confusa",
  "No era lo que buscaba",
  OTRO_MOTIVO,
];

function MessageBubble({
  message,
  speaking = false,
  typedText = "",
  reaction = "idle",
  onFollowUp,
  onChecklist,
  onRate,
}) {
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [pendingDislike, setPendingDislike] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [motivoDetalle, setMotivoDetalle] = useState("");
  const motivoDetalleRef = useRef(null);
  const hasRating = message.calificacion !== null && message.calificacion !== undefined;
  const isBot = message.type === "bot";
  const shown = speaking ? typedText || message.text : message.text;
  const typing = speaking && typedText.length < message.text.length;
  const motivoGroupName = `rating-motivo-${message.id}`;
  const pideDetalle = motivo === OTRO_MOTIVO;

  useEffect(() => {
    if (pideDetalle) motivoDetalleRef.current?.focus();
  }, [pideDetalle]);

  const actionList = Array.isArray(message.actions)
    ? message.actions
    : message.action
      ? [message.action]
      : [];

  async function rateResponse(value, motivoElegido = "") {
    if (!message.consultaId || ratingBusy) return;
    setRatingBusy(true);
    setRatingError("");
    try {
      const result = await calificarConsulta(message.consultaId, value, {
        publico: message.publicRating,
        motivo: motivoElegido,
      });
      setRatingSubmitted(true);
      setPendingDislike(false);
      onRate?.(message.id, result?.calificacion ?? value, result?.motivoCalificacion ?? (motivoElegido || null));
    } catch (error) {
      setRatingError(apiErrorMessage(error, "No se pudo guardar tu opinión."));
    } finally {
      setRatingBusy(false);
    }
  }

  function handlePositive() {
    if (hasRating || ratingBusy) return;
    setPendingDislike(false);
    setMotivo("");
    setMotivoDetalle("");
    setRatingError("");
    rateResponse(1);
  }

  function handleNegative() {
    if (hasRating || ratingBusy) return;
    setRatingError("");
    setPendingDislike(true);
  }

  function handleEnviarMotivo() {
    if (!motivo) {
      setRatingError("Elegí un motivo para continuar.");
      return;
    }
    const detalle = motivoDetalle.trim();
    if (pideDetalle && !detalle) {
      setRatingError("Escribí brevemente qué pasó para poder ayudarte mejor.");
      motivoDetalleRef.current?.focus();
      return;
    }
    rateResponse(0, pideDetalle ? detalle : motivo);
  }

  function handleCancelarMotivo() {
    setPendingDislike(false);
    setMotivo("");
    setMotivoDetalle("");
    setRatingError("");
  }

  return (
    <article
      className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"} animate-fade-up`}
      aria-label={isBot ? "Respuesta del asistente" : "Tu mensaje"}
      {...(isBot ? { "data-bot-message": "", tabIndex: -1 } : {})}
    >
      {isBot && (
        <ChatBotAvatar
          reaction={speaking ? reaction : "idle"}
          size={32}
          static={!speaking}
          speaking={speaking}
        />
      )}
      <div className={`chat-msg ${isBot ? "" : "chat-msg--user"}`}>
        <div className="chat-msg__body">
          {isBot ? (
            <div><FormattedAnswer text={shown} />{typing && <span className="inline-block w-0.5 h-[1.05em] -mb-0.5 ml-0.5 align-middle animate-pulse-soft bg-brand-deep" />}</div>
          ) : (
            <p className="m-0 whitespace-pre-wrap">{shown}{typing && <span className="inline-block w-0.5 h-[1.05em] -mb-0.5 ml-0.5 align-middle animate-pulse-soft bg-[#070E20]" />}</p>
          )}
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
            if (action.type === "checklist") {
              return <ChecklistButton key={index} action={action} onChecklist={onChecklist} />;
            }
            if (action.type === "location") {
              return <LocationCard key={index} action={action} />;
            }
            return null;
          })}
          {!typing && isBot && message.canRate && (
            <div className="mt-3 border-t border-line/70 pt-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">¿Te sirvió esta respuesta?</span>
                <button
                  type="button"
                  disabled={ratingBusy || hasRating}
                  aria-pressed={message.calificacion === 1}
                  onClick={handlePositive}
                  className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    message.calificacion === 1
                      ? "border-brand-deep bg-brand-deep text-white"
                      : "border-line text-muted hover:bg-mist hover:text-ink"
                  }`}
                >
                  <span aria-hidden="true">👍</span>
                  Sí
                </button>
                <button
                  type="button"
                  disabled={ratingBusy || hasRating}
                  aria-pressed={message.calificacion === 0}
                  aria-expanded={pendingDislike}
                  aria-controls={`${motivoGroupName}-panel`}
                  onClick={handleNegative}
                  className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    message.calificacion === 0 || pendingDislike
                      ? "border-brand-deep bg-brand-deep text-white"
                      : "border-line text-muted hover:bg-mist hover:text-ink"
                  }`}
                >
                  <span aria-hidden="true">👎</span>
                  No
                </button>
                {(hasRating || ratingSubmitted) && (
                  <span className="animate-fade-in text-xs text-ok" role="status">
                    ¡Gracias por tu opinión! Nos ayuda a mejorar.
                  </span>
                )}
              </div>

              {pendingDislike && !hasRating && (
                <fieldset
                  id={`${motivoGroupName}-panel`}
                  className="rating-panel-enter mt-3 rounded-xl border border-line bg-paper p-3"
                >
                  <legend className="px-1 text-sm font-semibold text-ink">
                    ¿Qué pasó con la respuesta?
                  </legend>
                  <div className="stagger-children mt-2 grid gap-2 sm:grid-cols-2">
                    {MOTIVOS_NO_UTIL.map((opcion) => (
                      <label
                        key={opcion}
                        className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          motivo === opcion
                            ? "border-brand-deep bg-mist text-ink"
                            : "border-line text-ink hover:bg-mist"
                        }`}
                      >
                        <input
                          type="radio"
                          name={motivoGroupName}
                          value={opcion}
                          checked={motivo === opcion}
                          onChange={() => setMotivo(opcion)}
                          className="h-4 w-4 shrink-0 accent-[var(--color-brand-deep)]"
                        />
                        <span>{opcion}</span>
                      </label>
                    ))}
                  </div>
                  {pideDetalle && (
                    <div className="rating-detail-enter mt-3">
                      <label
                        htmlFor={`${motivoGroupName}-detalle`}
                        className="block text-sm font-medium text-ink"
                      >
                        Contanos qué pasó (obligatorio)
                      </label>
                      <textarea
                        id={`${motivoGroupName}-detalle`}
                        ref={motivoDetalleRef}
                        value={motivoDetalle}
                        onChange={(event) => setMotivoDetalle(event.target.value)}
                        rows={3}
                        maxLength={300}
                        aria-describedby={`${motivoGroupName}-detalle-ayuda`}
                        placeholder="Escribí con tus palabras qué faltó o qué estuvo mal…"
                        className="mt-1.5 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-base leading-6 text-ink placeholder:text-muted focus:border-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-deep/40"
                      />
                      <div
                        id={`${motivoGroupName}-detalle-ayuda`}
                        className="mt-1 flex items-center justify-between gap-3 text-xs text-muted"
                      >
                        <span>Cuanto más detalle, mejor podemos mejorar la respuesta.</span>
                        <span aria-hidden="true">{motivoDetalle.length}/300</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEnviarMotivo}
                      disabled={ratingBusy || !motivo || (pideDetalle && !motivoDetalle.trim())}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-deep px-4 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ratingBusy ? "Enviando…" : "Enviar opinión"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelarMotivo}
                      disabled={ratingBusy}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-mist disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </fieldset>
              )}

              {message.calificacion === 0 && message.motivoCalificacion && (
                <p className="animate-fade-in mt-2 text-xs text-muted">
                  Motivo indicado: {message.motivoCalificacion}
                </p>
              )}
              {ratingError && <p role="alert" className="mt-1 text-xs text-bad">{ratingError}</p>}
            </div>
          )}
          <span className={`chat-msg__meta ${isBot ? "" : "chat-msg__meta--end"}`}>
          {isBot && <span className="ui-dot" style={{ background: "var(--color-brand)" }} aria-hidden="true" />}
          {isBot ? "Asistente" : "Vos"} ·{" "}
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {new Date(message.timestamp).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </span>
      </div>
    </article>
  );
}

export default memo(MessageBubble);