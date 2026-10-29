import { Link } from "react-router-dom";
import PendingBackend from "./PendingBackend";

export default function ReportsPage() {
  return (
    <div className="max-w-5xl">
      <div className="border-b border-line/70 pb-10">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · Información ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl md:text-4xl font-extrabold tracking-tight text-ink">
          Reportes y analíticas
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Consultá indicadores de actividad, trámites y atención ciudadana cuando estén disponibles con datos verificados.
        </p>
      </div>

      <div className="mt-8">
        <PendingBackend
          title="Los informes todavía no están disponibles"
          description="Para evitar confusiones, ocultamos las cifras de demostración y los expedientes ficticios. Esta sección se habilitará cuando la aplicación cuente con una fuente de datos conectada para los reportes."
          className="mb-0"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-paper p-6 md:p-10">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand-deep" aria-hidden="true">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3 3v18h18M8 15v-4m4 4V6m4 9V9m4 6v-3" />
            </svg>
          </div>
          <h2 className="mt-5 mb-0 text-xl font-bold text-ink">Todavía no hay datos para mostrar</h2>
          <p className="mt-3 mb-0 text-sm leading-relaxed text-muted">
            No se perdió ninguna información. Simplemente, esta pantalla aún no recibe datos reales para generar informes confiables.
          </p>
          <Link
            to="/admin"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-deep px-5 py-3 text-sm font-semibold text-white no-underline transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
          >
            Volver al panel
          </Link>
        </div>
      </section>
    </div>
  );
}
