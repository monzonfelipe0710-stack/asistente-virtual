import { useState } from "react";
import { users as seedUsers } from "../../data/mockUsers";
import { useToast } from "../common/Toast";
import UserFormModal from "./UserFormModal";

export default function UserTable() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(seedUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [justUpdated, setJustUpdated] = useState(null);
  const push = useToast();

  const filtered = rows.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditUser(null);
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditUser(user);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditUser(null);
  }

  function handleSave(form) {
    if (editUser) {
      setRows((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...form } : u)));
      push(`Usuario "${form.name}" actualizado.`, "success");
      setJustUpdated(editUser.id);
    } else {
      const nextId = Math.max(...rows.map((u) => u.id), 0) + 1;
      const created = {
        ...form,
        id: nextId,
        lastAccess: "—",
        avatar: null,
        phone: "",
        createdAt: new Date().toLocaleDateString("es-AR"),
      };
      setRows((prev) => [created, ...prev]);
      push(`Usuario "${form.name}" creado.`, "success");
      setJustUpdated(nextId);
    }
    setTimeout(() => setJustUpdated(null), 2000);
    closeModal();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-ink m-0">
            Gestión de Usuarios
          </h1>
          <p className="text-xs uppercase tracking-wide text-muted m-0 mt-2">
            {rows.length} usuarios registrados
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-6 py-3 bg-brand-deep text-paper text-xs font-bold uppercase tracking-wide hover:bg-brand-dark transition duration-200 hover:-translate-y-0.5 self-start cursor-pointer"
        >
          + Nuevo Usuario
        </button>
      </div>

      <div className="bg-paper border border-line">
        <div className="p-6 border-b border-line">
          <div className="relative max-w-xs">
            <svg className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuarios..."
              className="w-full pl-9 pr-3 py-3 text-sm border border-line outline-none bg-paper text-ink placeholder:text-muted focus:border-brand transition-colors"
              aria-label="Buscar usuarios"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-mist text-left text-[10px] uppercase tracking-widest text-muted">
                <th className="px-6 py-3 font-semibold">Nombre</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Rol</th>
                <th className="px-6 py-3 font-semibold">Departamento</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold">Último acceso</th>
                <th className="px-6 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-mist transition-colors ${justUpdated === user.id ? "row-new" : ""}`}
                >
                  <td className="px-6 py-4 font-semibold text-ink">{user.name}</td>
                  <td className="px-6 py-4 text-muted text-xs">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      user.role === "Superadmin"
                        ? "bg-ink text-paper"
                        : user.role === "Administrador"
                        ? "bg-brand-deep text-paper"
                        : "bg-mist text-muted"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted text-xs">{user.department}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${
                      user.status === "Activo" ? "text-ok" : "text-muted"
                    }`}>
                      <span className={`w-1.5 h-1.5 ${user.status === "Activo" ? "bg-ok" : "bg-line"}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted text-xs">{user.lastAccess}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(user)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper bg-brand-deep cursor-pointer hover:bg-brand-dark transition duration-200 hover:-translate-y-0.5"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-8 m-0">
            No se encontraron usuarios con ese criterio de búsqueda.
          </p>
        )}
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editUser={editUser}
      />
    </div>
  );
}
