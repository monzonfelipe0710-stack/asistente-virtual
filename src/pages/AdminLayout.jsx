import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import GlobalSearch from "../components/admin/GlobalSearch";
import NotificationCenter from "../components/admin/NotificationCenter";
import useLocalStorage from "../hooks/useLocalStorage";

export default function AdminLayout() {
  const location = useLocation();
  const outletRef = useRef(null);
  const [dark, setDark] = useLocalStorage("chatap-dark-mode", false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const el = outletRef.current;
    if (el) {
      el.classList.remove("animate-page-enter");
      void el.offsetWidth;
      el.classList.add("animate-page-enter");
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-primary flex-shrink-0 flex items-center justify-between px-5 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="text-sm font-semibold text-white/90 tracking-tight hidden sm:inline">Panel de Administración</span>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <NotificationCenter />
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer bg-transparent border-none"
              title={dark ? "Modo claro" : "Modo oscuro"}
            >
              {dark ? (
                <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-body" style={{ background: "var(--bg-body)" }}>
          <div ref={outletRef} className="animate-page-enter max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
