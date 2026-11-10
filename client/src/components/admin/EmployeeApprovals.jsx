import PendingBackend from "./PendingBackend";

export default function EmployeeApprovals() {
  return (
    <div className="max-w-6xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · Personal ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Solicitudes de empleados
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Alta y revisión de solicitudes para acceder al panel de administración.
        </p>
      </header>
      <PendingBackend
        title="Próximamente"
        description="El flujo de solicitudes de empleados quedó fuera del backend actual. No se muestran ni se procesan solicitudes de ejemplo."
        className="mt-8"
      />
    </div>
  );
}
