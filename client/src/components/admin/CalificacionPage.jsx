function Metric({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5 md:p-6">
      <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-3 mb-0 text-3xl font-extrabold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="mt-2 mb-0 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function CalificacionPage() {
  return (
    <div className="max-w-6xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">[ Administración · Calidad ]</p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Calificación</h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Seguimiento de las valoraciones de la ciudadanía para saber si las respuestas del asistente fueron útiles y detectar oportunidades de mejora.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-line bg-paper p-5 md:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="m-0 text-lg font-bold text-ink">Valoraciones de las respuestas</h2>
            <p className="mt-1 mb-0 text-sm text-muted">Los indicadores se habilitarán cuando el sistema registre y exponga valoraciones reales.</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="Valoraciones recibidas" value="—" hint="Dato aún no disponible" />
          <Metric label="Respuestas útiles" value="—" hint="Requiere registro de votos positivos" />
          <Metric label="Respuestas no útiles" value="—" hint="Requiere registro de votos negativos" />
        </div>
        <div className="mt-6 rounded-xl border border-line bg-mist/40 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-brand-deep" aria-hidden="true">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 9v3m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" /></svg>
            </span>
            <div>
              <h3 className="m-0 text-sm font-bold text-ink">La recepción de calificaciones todavía no está conectada</h3>
              <p className="mt-2 mb-0 text-sm leading-relaxed text-muted">
                En el frontend actual no existe un servicio para guardar votos ni consultar valoraciones. Por eso los indicadores se muestran como no disponibles y no como cero. Para recibir opiniones reales, el chat debe enviar la valoración y el sistema debe ofrecer un servicio para almacenarla y consultarla.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-line">
          <div className="border-b border-line px-5 py-4">
            <h3 className="m-0 text-base font-bold text-ink">Comentarios de la ciudadanía</h3>
            <p className="mt-1 mb-0 text-sm text-muted">Las opiniones aparecerán aquí cuando exista una fuente de datos conectada.</p>
          </div>
          <div className="px-5 py-10 text-center">
            <p className="m-0 text-sm font-semibold text-ink">Todavía no hay datos para mostrar</p>
            <p className="mt-2 mb-0 text-sm text-muted">No se generaron valoraciones de ejemplo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
