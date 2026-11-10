import PendingBackend from "../admin/PendingBackend";

export default function DownloadSection() {
  return (
    <section className="rounded-xl border border-line bg-paper p-5">
      <h2 className="m-0 text-sm font-semibold text-ink">Descargas</h2>
      <p className="mb-0 mt-1 text-xs text-muted">
        Formularios, guías y plantillas disponibles para la ciudadanía.
      </p>
      <PendingBackend
        title="Próximamente"
        description="Las descargas todavía no tienen un listado ciudadano conectado. No se muestran documentos de demostración."
        className="mt-4 mb-0"
      />
    </section>
  );
}
