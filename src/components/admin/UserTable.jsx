import { useState, useEffect } from "react";
import { users as initialUsers } from "../../data/mockUsers";
import Pagination, { usePagination } from "../common/Pagination";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import UserFormModal from "./UserFormModal";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import useSortable from "../../hooks/useSortable";

export default function UserTable() {
  const addToast = useToast();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [localUsers, setLocalUsers] = useState(initialUsers);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filtered = localUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted, toggleSort, getSortIndicator } = useSortable(filtered, "name", "asc");
  const { page, totalPages, paginatedItems, setPage } = usePagination(sorted, 8);

  function confirmDelete() {
    setLocalUsers((prev) => prev.filter((u) => u.id !== deleteId));
    setDeleteId(null);
    addToast("Usuario eliminado", "info");
  }

  function handleSave(data) {
    if (data.id) {
      setLocalUsers((prev) => prev.map((u) => u.id === data.id ? { ...u, name: data.name, email: data.email, role: data.role, department: data.department, status: data.status } : u));
      addToast("Usuario actualizado", "success");
    } else {
      const newId = Math.max(...localUsers.map((u) => u.id), 0) + 1;
      setLocalUsers((prev) => [...prev, { id: newId, ...data, lastAccess: new Date().toLocaleString("es-AR"), phone: "", createdAt: new Date().toLocaleDateString("es-AR") }]);
      addToast("Usuario creado", "success");
    }
    setFormOpen(false);
    setEditUser(null);
  }

  function openEdit(user) { setEditUser(user); setFormOpen(true); }
  function openNew() { setEditUser(null); setFormOpen(true); }

  function exportCSV() {
    const headers = ["Nombre,Email,Rol,Departamento,Estado,Último acceso"];
    const rows = filtered.map((u) => `"${u.name}","${u.email}","${u.role}","${u.department}","${u.status}","${u.lastAccess}"`);
    const blob = new Blob([headers.concat(rows).join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "usuarios_chatap.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    addToast("CSV exportado", "success");
  }

  if (loading) return <div className="animate-fade-in"><div className="animate-shimmer h-8 w-48 rounded-lg mb-4" /><TableSkeleton rows={6} cols={6} /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Gestión de Usuarios</h1>
          <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">{localUsers.length} usuarios registrados · {localUsers.filter((u) => u.status === "Activo").length} activos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-ghost text-xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Exportar CSV
          </button>
          <button onClick={openNew} className="btn-primary flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="card card-border overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar usuarios..." className="input-field pl-9" aria-label="Buscar usuarios" />
          </div>
          <span className="text-xs text-slate-400 font-medium">{filtered.length} resultados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                <TH sortable sortKey="name" label="Nombre" onSort={toggleSort} indicator={getSortIndicator("name")} />
                <TH sortable sortKey="email" label="Email" onSort={toggleSort} indicator={getSortIndicator("email")} />
                <TH sortable sortKey="role" label="Rol" onSort={toggleSort} indicator={getSortIndicator("role")} />
                <TH sortable sortKey="department" label="Departamento" onSort={toggleSort} indicator={getSortIndicator("department")} />
                <TH sortable sortKey="status" label="Estado" onSort={toggleSort} indicator={getSortIndicator("status")} />
                <TH sortable sortKey="lastAccess" label="Último acceso" onSort={toggleSort} indicator={getSortIndicator("lastAccess")} />
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 stagger-children">
              {paginatedItems.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary-lighter flex items-center justify-center text-white text-xs font-bold shrink-0">{user.name.charAt(0)}</div>
                      <span className="font-medium text-slate-800 text-xs">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-lg ${user.role === "Administrador" ? "bg-purple-50 text-purple-600" : user.role === "Supervisor" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{user.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.status === "Activo" ? "text-emerald-600" : "text-slate-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === "Activo" ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.lastAccess}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(user)} className="px-2.5 py-1 text-[10px] font-medium text-accent bg-accent-light/50 rounded-lg cursor-pointer hover:bg-accent-light transition-colors">Editar</button>
                      <button onClick={() => setDeleteId(user.id)} className="px-2.5 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <EmptyState title="Sin resultados" description="No se encontraron usuarios con ese criterio de búsqueda." action={search ? <button onClick={() => { setSearch(""); setPage(1); }} className="btn-ghost text-xs">Limpiar filtros</button> : null} />}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <UserFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditUser(null); }} onSave={handleSave} editUser={editUser} />

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Eliminar usuario" confirmText="Eliminar" confirmDanger>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="text-sm text-slate-600 m-0">¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.</p>
        </div>
      </Modal>
    </div>
  );
}

function TH({ sortable, sortKey, label, onSort, indicator, className = "" }) {
  if (!sortable) return <th className={`px-4 py-3 font-semibold ${className}`}>{label}</th>;
  return (
    <th className={`px-4 py-3 font-semibold sort-header ${className}`} onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {indicator && <span className="text-[9px] text-accent">{indicator}</span>}
      </span>
    </th>
  );
}
