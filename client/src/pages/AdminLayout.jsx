import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { useAdmin, ROLES } from "../context/AdminContext";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex bg-soft">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((open) => !open)} />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-ink/35 lg:hidden"
        />
      )}
      {!sidebarOpen && (
        <button
          type="button"
          aria-label="Abrir panel lateral"
          aria-expanded="false"
          onClick={() => setSidebarOpen(true)}
          title="Mostrar navegación de ChatAP"
          className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-mist text-muted shadow-sm transition-colors hover:bg-paper hover:text-ink lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <div
        className="admin-content flex-1 flex flex-col min-w-0"
      >
        <header className="bg-paper/95 backdrop-blur border-b border-line h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div className="hidden sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">ChatAP</p>
            <p className="mt-0.5 text-xs text-faint">Centro de operaciones</p>
          </div>
          <div className="flex items-center gap-3">
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
          <div className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
