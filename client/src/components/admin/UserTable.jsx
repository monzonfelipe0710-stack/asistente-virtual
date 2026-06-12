import { useState } from "react";
import { users } from "../../data/mockUsers";
import Pagination, { usePagination } from "../common/Pagination";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";

export default function UserTable() {
  const addToast = useToast();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [localUsers, setLocalUsers] = useState(users);

  const filtered = localUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtered, 5);

  function confirmDelete() {
    setLocalUsers((prev) => prev.filter((u) => u.id !== deleteId));
    setDeleteId(null);
    addToast("Usuario eliminado", "info");
  }

  function exportCSV() {
    const headers = ["Nombre,Email,Rol,Departamento,Estado,Último acceso"];
    const rows = filtered.map((u) =>
      `"${u.name}","${u.email}","${u.role}","${u.department}","${u.status}","${u.lastAccess}"`
    );
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "usuarios_chatap.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    addToast("CSV exportado", "success");
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">
            {localUsers.length} usuarios registrados
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-ghost text-xs">
            Exportar CSV
          </button>
          <button className="btn-primary">+ Nuevo Usuario</button>
        </div>
      </div>

      <div className="card card-border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative max-w-xs">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar usuarios..."
              className="input-field pl-9"
              aria-label="Buscar usuarios"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Departamento</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Último acceso</th>
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 stagger-children">
              {paginatedItems.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-lg ${
                      user.role === "Administrador"
                        ? "bg-purple-50 text-purple-600"
                        : user.role === "Supervisor"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      user.status === "Activo" ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === "Activo" ? "bg-emerald-500" : "bg-slate-300"
                      }`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.lastAccess}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="px-3 py-1 text-xs font-medium text-accent bg-accent-light/50 rounded-lg cursor-pointer hover:bg-accent-light transition-colors">
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteId(user.id)}
                        className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8 font-medium">
            No se encontraron usuarios con ese criterio de búsqueda.
          </p>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar usuario"
        confirmText="Eliminar"
        confirmDanger
      >
        ¿Estás seguro de eliminar este usuario?
      </Modal>
    </div>
  );
}
