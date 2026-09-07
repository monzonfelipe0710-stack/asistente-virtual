import { permissionsForRole } from "../../../context/AdminContext";
import { useProfileData } from "../useProfileData";
import { SectionHeader, Icon, ICONS, Pill } from "../ui";

const KEY_ICON = {
  dashboard: ICONS.activity,
  mesa_entrada: ICONS.tramite,
  usuarios: ICONS.users,
  solicitudes: ICONS.solicitud,
  conocimiento: ICONS.chat,
  siged: ICONS.tramite,
  documentos: ICONS.solicitud,
  configuracion: ICONS.key,
  reportes: ICONS.solicitud,
};

export default function Permisos() {
  const data = useProfileData();
  if (!data) return null;
  const perms = permissionsForRole(data.userRole);
  const isSuper = data.isSuperadmin;

  return (
    <div>
      <SectionHeader
        title="Permisos y acceso"
        description={
          isSuper
            ? "Tenés acceso total al Panel de Administración."
            : "Lo que tu rol de Administrador puede hacer en el sistema."
        }
      />
      <div className="card card-border overflow-hidden">
        <div className="px-5 py-3 border-b border-line bg-mist/60 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-ink m-0">
            Rol <span className="font-mono">{data.userRole}</span>
          </p>
          {isSuper && <Pill tone="bg-ink text-paper">Acceso total</Pill>}
        </div>
        <ul className="divide-y divide-line">
          {perms.map((p) => (
            <li key={p.key} className="flex items-start gap-3 px-5 py-3.5">
              <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 bg-brand-deep/10 text-brand-deep">
                <Icon path={KEY_ICON[p.key] || ICONS.solicitud} className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink m-0">{p.label}</p>
                <p className="text-xs text-muted m-0 mt-0.5">{p.desc}</p>
              </div>
              <span className="badge bg-ok/10 text-ok shrink-0 mt-1">
                <Icon path={ICONS.check} className="w-3 h-3" />
                Permitido
              </span>
            </li>
          ))}
        </ul>
        <div className="px-5 py-3 border-t border-line bg-soft/60">
          <p className="text-[11px] text-faint m-0 leading-relaxed">
            No podés modificar tu propio rol ni elevar privilegios desde esta pantalla.
            Eso es exclusivo del Superadmin desde el Panel de Administración.
          </p>
        </div>
      </div>
    </div>
  );
}