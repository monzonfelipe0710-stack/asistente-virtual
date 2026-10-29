import PendingBackend from "./PendingBackend";

export default function SigedIntegration() {
  return (
    <div className="max-w-5xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · Expedientes ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Integración SIGED
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Consulta y sincronización de expedientes con el Sistema de Gestión Documental.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-line bg-paper p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-deep" aria-hidden="true">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 3.75h7l4.25 4.5v12A1.75 1.75 0 0116.5 22h-9A1.75 1.75 0 015.75 20.25V5.5A1.75 1.75 0 017.5 3.75zM14 4v5h4M8.5 13h7m-7 3.5h7" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-bold text-ink">Conexión pendiente de habilitación</h2>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-muted">
              No hay una conexión SIGED confirmada desde esta pantalla. Por eso no mostramos expedientes, tiempos de respuesta ni estados de sincronización que puedan confundirse con información oficial.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <PendingBackend
            title="Sincronización no disponible"
            description="Esta sección se habilitará cuando esté definida y conectada la API de SIGED. Hasta entonces, no se ejecutan sincronizaciones ni se modifican expedientes."
            className="mb-0"
          />
        </div>
      </section>
    </div>
  );
}
