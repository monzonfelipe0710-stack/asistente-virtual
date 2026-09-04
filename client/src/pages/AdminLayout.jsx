import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { useAuth } from "../context/AuthContext";

function ThemeToggle() {
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("animate-theme-transition");
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    const timer = setTimeout(
      () => root.classList.remove("animate-theme-transition"),
      250
    );
    return () => clearTimeout(timer);
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label="Cambiar tema"
      className="w-10 h-10 grid place-items-center rounded-lg transition-colors duration-200 cursor-pointer"
      style={{
        border: "1px solid var(--sidebar-border)",
        color: "var(--sidebar-text)",
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--sidebar-hover)";
        e.currentTarget.style.color = "var(--sidebar-text-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "var(--sidebar-text)";
      }}
    >
      {dark ? (
        <svg
          className="w-5 h-5 transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 transition-transform duration-300 hover:-rotate-45"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          />
        </svg>
      )}
    </button>
  );
}

export default function AdminLayout() {
  const { user, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  // Al cambiar de sección, la vista arranca arriba al instante y sin saltos.
  // El panel (sidebar, header) persiste: no se recarga en cada click.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // Solo Superadmin y Administrador pueden ver el Acceso Interno.
  // El Ciudadano (o visitante sin sesión) ve esta pantalla de bloqueo.
  const allowed = !!user && (userRole === "Superadmin" || userRole === "Administrador");

  if (!allowed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "var(--color-paper)" }}
      >
        <div className="card w-full max-w-md p-8 text-center animate-scale-in">
          <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center bg-bad/10 text-bad mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-ink m-0">Acceso restringido</h1>
          <p className="text-sm text-muted mt-2 m-0">
            {!user
              ? "Iniciá sesión con una cuenta de Administrador o Superadmin para entrar al Acceso Interno."
              : "Tu cuenta de Ciudadano no tiene permiso para entrar al Acceso Interno."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            {!user && (
              <Link to="/login" className="btn-primary no-underline">
                Iniciar sesión
              </Link>
            )}
            <Link to="/" className="btn-ghost no-underline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen overflow-hidden flex transition-colors duration-200"
      style={{ backgroundColor: "var(--color-paper)" }}
    >
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />

      <div
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-[margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          marginLeft: sidebarOpen ? "var(--sidebar-width)" : "var(--sidebar-collapsed-width)",
        }}
      >
        {/* Header */}
        <header
          className="h-14 shrink-0 flex items-center justify-end px-4 lg:px-6 backdrop-blur-md"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-paper) 80%, transparent)",
          }}
        >
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-deep text-paper text-[11px] font-bold uppercase">
                  {user.name ? user.name[0] : "?"}
                </span>
                <span
                  className="text-xs font-semibold truncate max-w-32"
                  style={{ color: "var(--sidebar-text-hover)" }}
                >
                  {user.name}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${userRole === "Superadmin" ? "bg-ink text-paper" : "bg-brand-deep/10 text-brand-deep"}`}>
                  {userRole}
                </span>
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 min-h-0 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
          <div key={pathname} className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
