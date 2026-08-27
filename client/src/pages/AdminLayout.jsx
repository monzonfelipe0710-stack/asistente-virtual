import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-paper">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-paper border-b border-line h-16 flex items-center px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 w-full">
            <h1 className="text-base font-bold uppercase tracking-wide text-ink m-0">
              Panel de Administración
            </h1>
            <span className="text-xs uppercase tracking-wide text-muted ml-auto">
              Subsecretaría de Recursos Humanos
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
