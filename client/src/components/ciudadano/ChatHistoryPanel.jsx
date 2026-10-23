import { HISTORY_LIMIT } from "../../lib/chatMemory";
import { Link } from "react-router-dom";

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
    <div className={`chat-sidebar flex h-full min-h-0 w-full flex-col ${className}`}>
      <div className="shrink-0 border-b border-line/70 p-4">
        <Link to="/" className="chat-sidebar-brand mb-5 flex items-center gap-3 rounded-xl px-1 py-1 no-underline">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-deep text-xs font-black tracking-tight text-white shadow-sm">
            AP
          </span>
          <span className="text-base font-bold tracking-tight text-ink">
            ChatAP<span className="text-brand">.</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => onNewChat?.()}
          className="chat-new-button group inline-flex min-h-11 w-full items-center justify-start gap-3 rounded-xl border border-line/80 bg-paper px-3.5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:border-brand/40 hover:bg-mist/70 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand cursor-pointer"
        >
          <svg className="h-4 w-4 text-brand transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
          </svg>
          <span>Nueva consulta</span>
          <kbd className="ml-auto rounded-md border border-line bg-mist/60 px-1.5 py-0.5 text-[10px] font-medium text-muted">+</kbd>
        </button>
        <div className="mt-5 flex items-center gap-2 px-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" aria-hidden="true" />
          <h2 className="m-0 text-xs font-semibold text-muted">Tus conversaciones</h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto chat-scroll px-4 py-5">
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <h3 className="m-0 text-[10px] font-bold uppercase tracking-[0.16em] text-faint">
            Recientes
          </h3>
          {visible.length > 0 && (
            <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-semibold text-muted">
              {visible.length}
            </span>
          )}
          {visible.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={() => onClearAll()}
              className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:bg-bad/10 hover:text-bad cursor-pointer"
            >
              Borrar
            </button>
          )}
        </div>

        {error ? (
          <p role="alert" className="m-0 rounded-xl border border-bad/20 bg-bad/5 p-3 text-sm leading-relaxed text-bad">
            No se pudo cargar el historial: {error}
          </p>
        ) : loading ? (
          <div role="status" className="space-y-2">
            <span className="sr-only">Cargando historial…</span>
            {[0, 1, 2].map((item) => (
              <div key={item} className="history-skeleton h-12 animate-pulse rounded-xl bg-mist/70" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-mist/30 px-4 py-6 text-center">
            <span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-paper text-muted shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h5m-8 6 1.7-3.4A8 8 0 114 17l-3 3z" />
              </svg>
            </span>
            <p className="m-0 text-sm font-semibold text-ink">Todavía no hay consultas</p>
            <p className="m-0 mt-1 text-xs leading-relaxed text-muted">
              Cuando consultes a ChatAP, tus consultas recientes aparecerán acá.
            </p>
          </div>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {visible.map((query, index) => (
              <li
                key={query.id ?? `${query.at || ""}-${query.text}`}
                className="history-item-enter group flex items-center gap-1"
                style={{ animationDelay: `${Math.min(index, 7) * 35}ms` }}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(query)}
                  title={query.text}
                  className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-3 py-3 text-left transition-colors hover:border-line/70 hover:bg-mist/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand cursor-pointer"
                >
                  <span className="block line-clamp-2 text-sm font-medium leading-snug text-ink">
                    {query.text}
                  </span>
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(query)}
                    aria-label={`Borrar del historial: ${query.text}`}
                    title="Borrar esta consulta"
                    className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-bad/10 hover:text-bad opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0v11a1 1 0 001 1h8a1 1 0 001-1V7M10 11v6m4-6v6" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
