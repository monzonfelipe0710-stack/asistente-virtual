import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../common/Toast";
import PasswordField from "../../common/PasswordField";
import { useProfileData } from "../useProfileData";
import {
  applyTheme,
  watchSystemTheme,
  savePreferences,
} from "../../../lib/preferences";
import {
  loadSessionsFor,
  endOtherSessions,
  currentSession,
  buildDeviceLabel,
} from "../../../lib/sessions";
import { SectionHeader, Icon, ICONS } from "../ui";
import { formatDateTime, timeAgo } from "../../../utils/date";

export default function Seguridad() {
  const data = useProfileData();
  const { user, changePassword, deleteAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [changing, setChanging] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentPrefs = prefs ?? data?.prefs;
  const currentSessions = sessions ?? data?.sessions;
  const activeSessionId = currentSession()?.sessionId;

  // Aplica la preferencia de tema y sigue al sistema si corresponde.
  // Solo fuerza el tema cuando el usuario elige uno explícito; si no hay
  // preferencia guardada, respeta el tema actual del documento (Navbar/Admin).
  useEffect(() => {
    if (!data || !user) return;
    const prefs = currentPrefs || {};
    applyTheme(prefs.theme);
    if (prefs.theme === "system") {
      const stop = watchSystemTheme(true);
      return () => stop && stop();
    }
    return undefined;
  }, [currentPrefs, data, user]);

  if (!data || !user) return null;

  function setPref(name, value) {
    const next = { ...currentPrefs, [name]: value };
    setPrefs(next);
    savePreferences(user.id, { [name]: value });
    if (name === "theme") {
      if (value === "system") {
        try {
          localStorage.removeItem("theme");
        } catch {
          /* noop */
        }
      }
      applyTheme(value);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    if (pw.next.length < 6) {
      setPwError("La contraseña nueva debe tener al menos 6 caracteres.");
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError("La confirmación no coincide con la contraseña nueva.");
      return;
    }
    setChanging(true);
    try {
      await changePassword(pw.current, pw.next);
      toast("Contraseña actualizada correctamente.", "success");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setChanging(false);
    }
  }

  function handleCloseOtherSessions() {
    const keep = activeSessionId || "";
    endOtherSessions(user.id, keep);
    setSessions(loadSessionsFor(user.id));
    toast("Se cerraron las demás sesiones de tu cuenta.", "success");
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      toast("Tu cuenta fue eliminada.", "success");
      navigate("/", { replace: true });
    } catch (err) {
      toast(err.message || "No se pudo borrar la cuenta.", "error");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Seguridad" description="Controlá el acceso a tu cuenta." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cambiar contraseña */}
        <div className="card card-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 rounded-xl grid place-items-center bg-bad/10 text-bad shrink-0">
              <Icon path={ICONS.key} className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-ink m-0">Cambiar contraseña</h3>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <PasswordField label="Contraseña actual" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
            <PasswordField label="Contraseña nueva" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
            <PasswordField label="Confirmar contraseña nueva" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
            {pwError && <p className="text-xs text-bad m-0">{pwError}</p>}
            <button type="submit" disabled={changing} className="btn-primary w-full text-[13px]! disabled:opacity-60">
              {changing ? "Actualizando…" : "Actualizar contraseña"}
            </button>
          </form>
        </div>

        {/* Sesiones y acceso */}
        <div className="card card-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 rounded-xl grid place-items-center bg-brand-deep/10 text-brand-deep shrink-0">
              <Icon path={ICONS.shield} className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-ink m-0">Sesiones y acceso</h3>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div className="rounded-xl bg-mist px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-widest text-faint">Último acceso</dt>
              <dd className="text-ink font-semibold m-0 mt-0.5">{user.lastAccessAt ? formatDateTime(user.lastAccessAt) : "—"}</dd>
            </div>
            <div className="rounded-xl bg-mist px-3 py-2.5">
              <dt className="text-[10px] uppercase tracking-widest text-faint">Miembro desde</dt>
              <dd className="text-ink font-semibold m-0 mt-0.5">{user.createdAt ? formatDateTime(user.createdAt) : "—"}</dd>
            </div>
          </dl>

          <p className="text-[11px] uppercase tracking-widest text-muted font-semibold m-0 mb-2">
            Sesiones activas ({currentSessions.length})
          </p>
          <ul className="divide-y divide-line mb-4">
            {currentSessions.length === 0 && (
              <li className="text-xs text-muted py-2">Sin registros de sesión todavía.</li>
            )}
            {currentSessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-ink m-0 font-medium truncate">{s.device || buildDeviceLabel()}</p>
                  <p className="text-[11px] text-faint m-0">
                    {s.sessionId === activeSessionId ? "Esta sesión · " : ""}última actividad {timeAgo(s.lastSeenAt)}
                  </p>
                </div>
                {s.sessionId === activeSessionId && (
                  <span className="badge bg-ok/10 text-ok shrink-0">Actual</span>
                )}
              </li>
            ))}
          </ul>

          <button onClick={handleCloseOtherSessions} className="btn-ghost w-full text-[13px]!" disabled={currentSessions.length <= 1}>
            Cerrar sesión en otros dispositivos
          </button>
          <p className="text-[11px] text-faint m-0 mt-2 leading-relaxed">
            En la versión local se registran las sesiones de este navegador. El cierre remoto de otras
            máquinas requiere un backend de sesiones (ver README).
          </p>
        </div>
      </div>

      {/* Preferencias */}
      <div className="card card-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-9 h-9 rounded-xl grid place-items-center bg-info/10 text-info shrink-0">
            <Icon path={ICONS.key} className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-ink m-0">Preferencias</h3>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted m-0 mb-2">Tema</p>
          <div className="flex gap-2">
            {[
              { key: "light", label: "Claro" },
              { key: "dark", label: "Oscuro" },
              { key: "system", label: "Sistema" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setPref("theme", t.key)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  currentPrefs.theme === t.key
                    ? "bg-brand-deep text-paper border-brand-deep"
                    : "bg-paper text-muted border-line hover:text-ink hover:bg-mist"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-faint m-0 mt-2">
            {currentPrefs.theme === "system"
              ? "Sigue la configuración del sistema operativo."
              : "Aplica el tema seleccionado en toda la aplicación."}
          </p>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="card card-border border-bad/30">
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-bad m-0">Zona de peligro</h3>
              <p className="text-sm text-muted m-0 mt-1">
                {confirmDelete
                  ? "Se borrará tu cuenta, tus solicitudes, conversaciones y notificaciones. No se puede deshacer."
                  : "Borrá tu cuenta de forma definitiva."}
              </p>
            </div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-bad text-paper text-[13px] font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Borrar mi cuenta
              </button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2.5 rounded-xl border border-line text-[13px] font-semibold text-muted hover:bg-mist hover:text-ink transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2.5 rounded-xl bg-bad text-paper text-[13px] font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-60"
                >
                  {deleting ? "Eliminando…" : "Sí, eliminar"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}