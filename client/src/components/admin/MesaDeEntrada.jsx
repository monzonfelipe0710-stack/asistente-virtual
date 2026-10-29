import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";
import { roleLabel } from "../../lib/roles";
import PendingBackend from "./PendingBackend";

export default function MesaDeEntrada() {
  const { can, role } = useAdmin();
  const { user } = useAuth();

  if (!can("mesa_entrada")) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-line bg-paper p-8 text-center">
        <div className="mb-3 text-3xl" aria-hidden="true">🔒</div>
        <h2 className="m-0 text-lg font-bold text-ink">Acceso restringido</h2>
        <p className="mt-2 mb-0 text-sm leading-relaxed text-muted">
          Tu rol actual ({roleLabel(role)}) no tiene permiso para gestionar la Mesa de Entradas. Contactá a un administrador si necesitás acceso.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · Expedientes ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Mesa de Entradas
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Registro, consulta y seguimiento de ingresos y expedientes administrativos.
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
            <h2 className="m-0 text-lg font-bold text-ink">Registro de expedientes no conectado</h2>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-muted">
              Esta pantalla todavía no consume una API de Mesa de Entradas. No se muestran registros ficticios ni se habilitan acciones que aparenten crear expedientes o modificar sus estados.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <PendingBackend
            title="Gestión temporalmente no disponible"
            description="Cuando la integración esté disponible, desde aquí vas a poder consultar expedientes oficiales, registrar ingresos, actualizar estados y exportar datos reales. No se realizó ningún cambio en el servidor."
            className="mb-0"
          />
        </div>

        <p className="mt-5 mb-0 text-xs leading-relaxed text-muted">
          Sesión: {user?.name || user?.email || "Usuario autenticado"}. Los permisos de acceso se mantienen según tu rol.
        </p>
      </section>
    </div>
  );
}
