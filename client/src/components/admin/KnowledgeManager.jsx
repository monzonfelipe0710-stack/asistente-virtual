import PendingBackend from "./PendingBackend";

export default function KnowledgeManager() {
  return (
    <div className="max-w-6xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · Contenidos ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Base de conocimiento
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Gestión de contenidos de referencia para el asistente.
        </p>
      </header>
      <PendingBackend
        title="Próximamente"
        description="El backend todavía no ofrece una API para administrar una base de conocimiento independiente. El asistente responde a partir del catálogo de trámites."
        className="mt-8"
      />
    </div>
  );
}
