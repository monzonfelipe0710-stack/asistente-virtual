import PendingBackend from "./PendingBackend";

export default function ChatbotSettings() {
  return (
    <div className="max-w-5xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · Asistente ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Configuración del chatbot
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Ajustes de identidad, mensajes y comportamiento del asistente virtual.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-line bg-paper p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-deep" aria-hidden="true">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 5.75A2.75 2.75 0 016.75 3h10.5A2.75 2.75 0 0120 5.75v7.5A2.75 2.75 0 0117.25 16H11l-5 4v-4.25A2.75 2.75 0 014 13V5.75zM8 8h8m-8 3.5h5" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-bold text-ink">Configuración no conectada</h2>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-muted">
              Los ajustes del chatbot todavía no se pueden leer ni guardar desde esta pantalla. Para evitar mensajes engañosos, se quitaron los valores de ejemplo y el botón que confirmaba un guardado local como si fuera real.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <PendingBackend
            title="Cambios deshabilitados temporalmente"
            description="Cuando exista una conexión de lectura y guardado, podrás actualizar los mensajes y las opciones del asistente y confirmar que los cambios se hayan aplicado."
            className="mb-0"
          />
        </div>
      </section>
    </div>
  );
}
