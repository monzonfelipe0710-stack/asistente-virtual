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
        <svg className="w-5 h-5 transition-transform duration-300 rotate-0 hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 transition-transform duration-300 hover:-rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}

const SECTION_TITLES = {
  "/admin": "Resumen",
  "/admin/mesa-de-entrada": "Mesa de Entradas",
  "/admin/solicitudes": "Solicitudes",
  "/admin/usuarios": "Usuarios",
  "/admin/conocimiento": "Conocimiento",
  "/admin/documentos": "Documentos",
  "/admin/siged": "Integración SIGED",
  "/admin/configuracion": "Configuración",
  "/admin/reportes": "Reportes",
};

export default function AdminLayout() {
  const { user, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const allowed =
    !!user &&
    user.status !== "Suspendido" &&
    (userRole === "Superadmin" || userRole === "Administrador");

  const sectionTitle = Object.entries(SECTION_TITLES).find(([path]) =>
    pathname === path || (path !== "/admin" && pathname.startsWith(path))
  )?.[1] || "Administración";

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--color-paper)" }}>
        <div className="w-full max-w-md text-center animate-scale-in">
          <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center bg-bad/10 text-bad mb-6">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="kicker m-0">[ Panel de administración ]</p>
          <h1 className="display-3 text-ink m-0 mt-4">ACCESO RESTRINGIDO.</h1>
          <p className="text-sm text-muted mt-4 m-0 max-w-sm mx-auto">
            {!user
              ? "Iniciá sesión con una cuenta de Administrador o Superadmin para entrar al Panel de Administración."
              : "Tu cuenta de Ciudadano no tiene permiso para entrar al Panel de Administración."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-8">
            {!user && <Link to="/login" className="btn-primary no-underline">Iniciar sesión</Link>}
            <Link to="/" className="btn-ghost no-underline">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex transition-colors duration-200" style={{ backgroundColor: "var(--color-paper)" }}>
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-[margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ marginLeft: sidebarOpen ? "var(--sidebar-width)" : "var(--sidebar-collapsed-width)" }}
      >
        <header
          className="h-16 shrink-0 flex items-center justify-between px-5 lg:px-8 border-b border-line/70 backdrop-blur-md"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-paper) 85%, transparent)" }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-faint m-0">Panel de administración</p>
            <h1 className="text-[15px] font-bold leading-tight tracking-tight m-0 truncate" style={{ color: "var(--sidebar-text-hover)" }}>{sectionTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-deep text-paper text-[11px] font-bold uppercase">{user.name ? user.name[0] : "?"}</span>
                <span className="flex flex-col leading-none">
                  <span className="text-xs font-semibold truncate max-w-32" style={{ color: "var(--sidebar-text-hover)" }}>{user.name}</span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--sidebar-text)" }}>{userRole}</span>
                </span>
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main ref={mainRef} className="flex-1 min-h-0 p-6 lg:p-10 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
