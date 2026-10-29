import PendingBackend from "./PendingBackend";

export default function KnowledgeManager() {
  return (
    <div className="max-w-5xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · ChatAP ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Administración del conocimiento
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Gestión de las respuestas y contenidos que utiliza el asistente para orientar a la ciudadanía.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-line bg-paper p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-deep" aria-hidden="true">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 6.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 10v5m0 3h.01M8.5 2.5h7" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-bold text-ink">Gestión de contenidos no conectada</h2>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-muted">
              Esta pantalla todavía no está conectada a una API de gestión de conocimiento. Para proteger la información, no mostramos artículos ficticios ni ofrecemos acciones que aparenten guardar cambios.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <PendingBackend
            title="Edición temporalmente no disponible"
            description="Cuando la integración esté habilitada, vas a poder consultar, crear, editar y desactivar respuestas guardadas desde este panel."
            className="mb-0"
          />
        </div>
      </section>
    </div>
  );
}
