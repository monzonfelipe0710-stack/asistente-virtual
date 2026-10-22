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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 m-0">Gestión de Usuarios</h1>
          <p className="text-xs text-slate-500 m-0 mt-1">
            {users.length} usuarios registrados
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-800 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-900 transition-colors self-start">
          + Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-xs">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuarios..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
              aria-label="Buscar usuarios"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Departamento</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Último acceso</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-md ${
                      user.role === "Administrador"
                        ? "bg-purple-50 text-purple-700"
                        : user.role === "Supervisor"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{user.department}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${
                      user.status === "Activo" ? "text-emerald-700" : "text-slate-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.status === "Activo" ? "bg-emerald-500" : "bg-slate-300"
                      }`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.lastAccess}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="px-3 py-1 text-xs text-blue-700 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            No se encontraron usuarios con ese criterio de búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
