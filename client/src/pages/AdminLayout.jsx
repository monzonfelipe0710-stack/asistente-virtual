import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { useAuth } from "../context/AuthContext";
import { roleLabel } from "../lib/roles";

const SECTION_TITLES = {
  "/admin": "Resumen",
  "/admin/mesa-de-entrada": "Mesa de Entradas",
  "/admin/solicitudes": "Solicitudes",
  "/admin/usuarios": "Usuarios",
  "/admin/sectores": "Sectores",
  "/admin/conocimiento": "Conocimiento",
  "/admin/tramites": "Trámites",
  "/admin/siged": "Integración SIGED",
  "/admin/configuracion": "Configuración",
  "/admin/reportes": "Reportes",
  "/admin/calificacion": "Calificación",
};

export default function AdminLayout() {
  const { user, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 1024
  );
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1024
  );
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  // Mantener sincronizado el layout con el tamaño de la ventana.
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!sidebarOpen || !isMobile) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, isMobile]);

  const allowed =
    !!user && (userRole === "SUPERUSUARIO" || userRole === "ADMINISTRADOR");

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
              ? "Iniciá sesión con una cuenta de administrador para entrar al Panel de Administración."
              : "Tu cuenta no tiene permiso para entrar al Panel de Administración."}
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
    <div className="admin-layout-shell h-screen overflow-hidden flex transition-colors duration-200" style={{ backgroundColor: "var(--color-paper)" }}>
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default border-0 bg-black/50 backdrop-blur-[2px]"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú de administración"
        />
      )}
      <div data-print-hide>
        <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      </div>
      <div
        className="admin-layout-content flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-[margin] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ marginLeft: isMobile ? 0 : (sidebarOpen ? "var(--sidebar-width)" : "var(--sidebar-collapsed-width)") }}
      >
        <header
          className="sticky top-0 z-20 h-16 shrink-0 flex items-center justify-between px-5 lg:px-8 border-b border-line/70 backdrop-blur-md"
          data-print-hide
          style={{ backgroundColor: "color-mix(in srgb, var(--color-paper) 85%, transparent)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="lg:hidden p-2 rounded-xl hover:bg-mist/70 transition-colors"
              aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-faint m-0">Panel de administración</p>
              <h1 className="text-[15px] font-bold leading-tight tracking-tight m-0 truncate" style={{ color: "var(--color-ink)" }}>{sectionTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden sm:flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-deep text-paper text-[11px] font-bold uppercase">{user.name ? user.name[0] : "?"}</span>
                <span className="flex flex-col leading-none">
                  <span className="text-xs font-semibold truncate max-w-32" style={{ color: "var(--color-ink)" }}>{user.name}</span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-muted)" }}>{roleLabel(userRole)}</span>
                </span>
              </span>
            )}
          </div>
        </header>

        <main ref={mainRef} id="admin-main" tabIndex={-1} aria-label="Panel de administración" className="admin-layout-main flex-1 min-h-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-9 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1440px]"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
