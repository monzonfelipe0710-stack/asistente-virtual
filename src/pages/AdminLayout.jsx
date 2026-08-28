import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { useAdmin, ROLES } from "../context/AdminContext";

const BREADCRUMBS = {
  "/admin": "Panel general",
  "/admin/usuarios": "Usuarios",
  "/admin/mesa-de-entrada": "Mesa de Entradas",
  "/admin/conocimiento": "Conocimiento",
  "/admin/documentos": "Documentos",
  "/admin/siged": "Integración SIGED",
  "/admin/configuracion": "Configuración",
  "/admin/reportes": "Reportes",
};

function ThemeToggle() {
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Cambiar tema"
      className="w-10 h-10 grid place-items-center rounded-xl border border-line text-muted hover:text-ink hover:bg-mist transition-colors"
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

export default function AdminLayout() {
  const { role, setRole } = useAdmin();
  const location = useLocation();
  const crumb = BREADCRUMBS[location.pathname] || "Panel";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-soft">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((open) => !open)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-paper border-b border-line h-16 flex items-center px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 grid place-items-center rounded-lg border border-line text-muted hover:text-ink hover:bg-mist transition-colors"
                aria-label="Mostrar panel de navegación"
                aria-expanded={sidebarOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold uppercase tracking-wide text-ink m-0 leading-tight truncate">
                Acceso Interno
              </h1>
              <nav className="flex items-center gap-1.5 text-[11px] text-muted m-0 leading-tight truncate" aria-label="Migas de pan">
                <span>Panel</span>
                <span className="text-faint">/</span>
                <span className="text-brand-deep font-semibold">{crumb}</span>
              </nav>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <label className="hidden sm:flex items-center gap-2 text-xs text-muted">
              Rol:
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field w-auto py-2 text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div key={location.pathname} className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
