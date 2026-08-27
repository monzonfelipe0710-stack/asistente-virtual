import { useState } from "react";
import { users } from "../../data/mockUsers";

export default function UserTable() {
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-ink m-0">
            Gestión de Usuarios
          </h1>
          <p className="text-xs uppercase tracking-wide text-muted m-0 mt-2">
            {users.length} usuarios registrados
          </p>
        </div>
        <button className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wide hover:bg-brand transition-colors self-start">
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
                <tr key={user.id} className="hover:bg-mist transition-colors">
                  <td className="px-6 py-4 font-semibold text-ink">{user.name}</td>
                  <td className="px-6 py-4 text-muted text-xs">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      user.role === "Administrador"
                        ? "bg-brand text-paper"
                        : user.role === "Supervisor"
                        ? "bg-ink text-paper"
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
                    <button className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper bg-ink cursor-pointer hover:bg-brand transition-colors">
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
    </div>
  );
}
