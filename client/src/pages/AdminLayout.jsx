import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import GlobalSearch from "../components/admin/GlobalSearch";

export default function AdminLayout() {
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.classList.remove("animate-page-enter");
    void el.offsetWidth;
    el.classList.add("animate-page-enter");
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100/50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-14 flex items-center px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 w-full">
            <h1 className="text-sm font-semibold text-primary m-0 tracking-tight">
              Panel de Administración
            </h1>
            <div className="ml-auto flex items-center gap-3">
              <GlobalSearch />
              <span className="text-xs text-slate-400 font-medium">
                Subsecretaría de Recursos Humanos
              </span>
            </div>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 p-6 overflow-y-auto animate-page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
