import { useState, useEffect } from "react";
import { userRoles, departments } from "../../data/mockUsers";

export default function UserFormModal({ open, onClose, onSave, editUser }) {
  const [form, setForm] = useState({ name: "", email: "", role: "Agente", department: "", status: "Activo" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (editUser) {
        setForm({ name: editUser.name, email: editUser.email, role: editUser.role, department: editUser.department, status: editUser.status });
      } else {
        setForm({ name: "", email: "", role: "Agente", department: "Mesa de Entradas", status: "Activo" });
      }
      setErrors({});
    }
  }, [open, editUser]);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "El nombre es obligatorio";
    if (!form.email.trim()) errs.email = "El email es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave(editUser ? { ...editUser, ...form } : form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div className="card card-border w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-primary m-0">{editUser ? "Editar usuario" : "Nuevo usuario"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 cursor-pointer bg-transparent border-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Nombre completo *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`input-field ${errors.name ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`} placeholder="Ej: Juan Pérez" />
            {errors.name && <p className="text-[10px] text-red-500 mt-0.5 m-0">{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={`input-field ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`} placeholder="ejemplo@rrhh.gob.ar" />
            {errors.email && <p className="text-[10px] text-red-500 mt-0.5 m-0">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Rol</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                {userRoles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Departamento</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field">
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-xs">Cancelar</button>
            <button type="submit" className="btn-primary text-xs">{editUser ? "Guardar cambios" : "Crear usuario"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
