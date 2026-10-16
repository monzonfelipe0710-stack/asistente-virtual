import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/Toast";
import { DetailModal, Icon, ICONS, Field } from "./ui";
import { employeeDepartments } from "../../data/mockEmployeeApprovals";

export default function EditProfileModal({ open, onClose, saved }) {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    name: user?.name || "",
    phone: user?.phone || "",
    department: user?.department || "",
    position: user?.position || "",
  }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const isEmployee = !!(user.department || user.position || user.cuil);

  function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    updateProfile(form)
      .then(() => {
        toast("Perfil actualizado correctamente.", "success");
        onClose();
        saved?.();
      })
      .catch((err) => {
        setError(err.message || "No se pudo actualizar el perfil.");
      })
      .finally(() => setSaving(false));
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
              Solo podés modificar los campos habilitados.
            </p>
          </div>
        </div>
        <button className="text-muted hover:text-ink p-1 cursor-pointer" onClick={onClose} aria-label="Cerrar">
          <Icon path={ICONS.close} />
        </button>
      </div>

      <form onSubmit={handleSave} className="px-5 py-4 overflow-y-auto space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Nombre completo *</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Teléfono</label>
          <input
            className="input-field"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="3704 00-0000"
          />
        </div>

        {isEmployee && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Dependencia</label>
              <select
                className="input-field cursor-pointer"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option value="">Seleccionar</option>
                {employeeDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Puesto</label>
              <input
                className="input-field"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </div>
          </div>
        )}

        {isEmployee && (
          <div className="rounded-xl border border-line bg-mist px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-faint m-0 mb-2">
              Datos validados · no editables
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <Field label="DNI" value={user.dni} mono />
              <Field label="CUIL" value={user.cuil} mono />
              <Field label="Correo electrónico" value={user.email} mono />
            </dl>
          </div>
        )}

        {error && (
          <p className="text-sm text-bad m-0">
            <Icon path={ICONS.alert} className="w-4 h-4 inline mr-1 -mt-0.5" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-line -mx-5 px-5 py-3 -mb-4 bg-soft/60">
          <button type="button" className="btn-ghost py-2! px-3.5! text-[13px]!" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary py-2! px-3.5! text-[13px]! disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </DetailModal>
  );
}