import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/Toast";
import { DetailModal, Icon, ICONS, Field } from "./ui";
import { generoLabel } from "../../lib/genero";

export default function EditProfileModal({ open, onClose, saved }) {
  const { user, updateProfile, isStaff } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return undefined;
    const frame = window.requestAnimationFrame(() => {
      setForm({
        firstName: user.firstName || user.nombre || "",
        lastName: user.lastName || user.apellido || "",
        email: user.email || "",
      });
      setError("");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, user]);

  if (!user) return null;

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      });
      toast("Perfil actualizado correctamente.", "success");
      onClose();
      saved?.();
    } catch (err) {
      setError(err.message || "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DetailModal open={open} onClose={onClose} width="max-w-lg">
      <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-line shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-brand-deep/10 text-brand-deep">
            <Icon path={ICONS.profile} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink m-0">Editar perfil</h2>
            <p className="text-[11px] text-muted m-0 mt-0.5">
              Actualizá tu nombre, apellido y correo electrónico.
            </p>
          </div>
        </div>
        <button type="button" className="text-muted hover:text-ink p-1 cursor-pointer" onClick={onClose} aria-label="Cerrar">
          <Icon path={ICONS.close} />
        </button>
      </div>

      <form onSubmit={handleSave} className="px-5 py-4 overflow-y-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-first-name" className="block text-xs font-medium text-muted mb-1">Nombre *</label>
            <input
              id="profile-first-name"
              className="input-field"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => setForm((previous) => ({ ...previous, firstName: e.target.value }))}
              maxLength={60}
              required
            />
          </div>
          <div>
            <label htmlFor="profile-last-name" className="block text-xs font-medium text-muted mb-1">Apellido *</label>
            <input
              id="profile-last-name"
              className="input-field"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => setForm((previous) => ({ ...previous, lastName: e.target.value }))}
              maxLength={60}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-email" className="block text-xs font-medium text-muted mb-1">Correo electrónico *</label>
          <input
            id="profile-email"
            type="email"
            className="input-field"
            autoComplete="email"
            inputMode="email"
            value={form.email}
            onChange={(e) => setForm((previous) => ({ ...previous, email: e.target.value }))}
            maxLength={254}
            required
          />
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Usá una dirección a la que tengas acceso. El correo se actualizará en tu cuenta.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-mist px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-faint m-0 mb-2">
            Datos de identidad · no editables
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label="DNI" value={user.dni} mono />
            <Field label="Género registrado" value={generoLabel(user.genero) || "—"} />
          </dl>
          <p className="mt-3 mb-0 text-[11px] leading-relaxed text-muted">
            Estos datos se mantienen protegidos porque están vinculados a la verificación de tu identidad.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-bad m-0">
            <Icon path={ICONS.alert} className="w-4 h-4 inline mr-1 -mt-0.5" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-line -mx-5 px-5 py-3 -mb-4 bg-soft/60">
          <button type="button" className="btn-ghost py-2! px-3.5! text-[13px]!" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary py-2! px-3.5! text-[13px]! disabled:opacity-60">
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </DetailModal>
  );
}
