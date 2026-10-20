import { HISTORY_LIMIT } from "../../lib/chatMemory";

function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Panel con el historial de consultas del usuario con cuenta.
 * Se usa como columna lateral en pantallas grandes y dentro de un diálogo
 * en pantallas chicas. Cada consulta se puede retomar con un toque o con el
 * teclado (son botones reales, no enlaces decorativos) y también borrar.
 */
export default function ChatHistoryPanel({
  queries = [],
  onSelect,
  onNewChat,
  onDelete,
  onClearAll,
  loading = false,
  error = "",
  className = "",
}) {
  const visible = queries.slice(0, HISTORY_LIMIT);

  return (
    <div className={`flex flex-col h-full min-h-0 w-full ${className}`}>
      <div className="shrink-0 p-3 border-b border-line">
        <button
          type="button"
          onClick={() => onNewChat?.()}
          className="btn-primary w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
          </svg>
          <span>Nuevo chat</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto chat-scroll p-3">
        <div className="flex items-center justify-between gap-2 mb-2 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted m-0">
            Historial de consultas
          </h2>
          {visible.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={() => onClearAll?.()}
              className="text-[11px] font-semibold text-muted hover:text-bad rounded-md px-1.5 py-0.5 transition-colors cursor-pointer"
            >
              Borrar todo
            </button>
          )}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-bad m-0 px-1 leading-relaxed">
            No se pudo cargar el historial: {error}
          </p>
        ) : loading ? (
          <p role="status" className="text-sm text-muted m-0 px-1 leading-relaxed">
            Cargando historial…
          </p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted m-0 px-1 leading-relaxed">
            Todavía no hiciste consultas. Cuando le preguntes algo a ChatAP, vas a poder
            retomarlo desde acá.
          </p>
        ) : (
          <ul className="list-none m-0 p-0 flex flex-col gap-1">
            {visible.map((query) => (
              <li key={query.id ?? `${query.at || ""}-${query.text}`} className="flex items-stretch gap-1">
                {onDelete && <button
                  type="button"
                  onClick={() => onSelect?.(query.text)}
                  className="flex-1 min-w-0 text-left rounded-xl border border-transparent hover:border-line hover:bg-mist px-3 py-2.5 transition-colors cursor-pointer"
                >
                  <span className="block text-sm text-ink leading-snug line-clamp-2">{query.text}</span>
                  {query.at && (
                    <span className="block text-[11px] text-muted mt-0.5">{formatWhen(query.at)}</span>
                  )}
                </button>}
                <button
                  type="button"
                  onClick={() => onDelete?.(query.at)}
                  aria-label={`Borrar del historial: ${query.text}`}
                  title="Borrar esta consulta"
                  className="shrink-0 self-center rounded-lg p-2 text-muted hover:text-bad hover:bg-mist transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v11a1 1 0 001 1h8a1 1 0 001-1V7M10 11v6m4-6v6"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
