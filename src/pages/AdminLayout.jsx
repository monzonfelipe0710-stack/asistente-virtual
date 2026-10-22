import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 h-14 flex items-center px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 w-full">
            <h1 className="text-sm font-semibold text-slate-800 m-0">
              Panel de Administración
            </h1>
            <span className="text-xs text-slate-400 ml-auto">
              Subsecretaría de Recursos Humanos
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
