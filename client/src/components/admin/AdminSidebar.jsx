import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

const sections = [
  {
    title: "INICIO",
    items: [
      {
        to: "/admin",
        label: "Resumen",
        perm: "dashboard",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z",
      },
    ],
  },
  {
    title: "TRABAJO DIARIO",
    items: [
      {
        to: "/admin/mesa-de-entrada",
        label: "Mesa de Entradas",
        perm: "mesa_entrada",
        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      },
      {
        to: "/admin/solicitudes",
        label: "Aprobación de empleados",
        perm: "solicitudes",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        to: "/admin/tramites",
        label: "Trámites",
        perm: "tramites",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
      },
    ],
  },
  {
    title: "GESTIÓN INSTITUCIONAL",
    items: [
      {
        to: "/admin/usuarios",
        label: "Usuarios",
        perm: "usuarios",
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      },
      {
        to: "/admin/sectores",
        label: "Sectores",
        perm: "sectores",
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      },
    ],
  },
  {
    title: "CALIDAD DEL ASISTENTE",
    items: [
      {
        to: "/admin/conocimiento",
        label: "Base de conocimiento",
        perm: "conocimiento",
        icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
      },
      {
        to: "/admin/calificacion",
        label: "Calificaciones",
        perm: "reportes",
        icon: "M7 10h10M7 14h6m-8 6 3.5-3H18a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v11a3 3 0 003 3z",
      },
      {
        to: "/admin/reportes",
        label: "Reportes",
        perm: "reportes",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      },
    ],
  },
  {
    title: "SISTEMA",
    items: [
      {
        to: "/admin/siged",
        label: "Integración SIGED",
        perm: "siged",
        icon: "M8 9l3 3-3 3m5 0h3M5 20h14a1 1 0 001-1V5a2 2 0 00-1-1H5a2 2 0 00-1 1v14a2 2 0 001 1z",
      },
      {
        to: "/admin/configuracion",
        label: "Configuración del asistente",
        perm: "configuracion",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z",
      },
    ],
  },
];

function SidebarIcon({ path, className = "" }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d={path}
      />
    </svg>
  );
}

export default function AdminSidebar({ open, onToggle }) {
  const { can } = useAdmin();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar pantallas móviles
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isLinkActive = (link) =>
    location.pathname === link.to ||
    (link.to !== "/admin" && location.pathname.startsWith(link.to));

  return (
    <aside
      id="admin-sidebar"
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isMobile && !open ? '-translate-x-full' : ''}`}
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        width: open
          ? "var(--sidebar-width)"
          : "var(--sidebar-collapsed-width)",
        height: "100vh",
      }}
      role="navigation"
      aria-label="Panel de administración"
    >
      {/* Header: identidad y toggle de la barra. */}
      <div
        className="flex items-center shrink-0 border-b overflow-hidden"
        style={{
          height: "72px",
          padding: open ? "0 16px 0 20px" : "0 16px",
          justifyContent: open ? "space-between" : "center",
          borderColor: "var(--sidebar-border)",
        }}
      >
        {!open ? (
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-transform duration-150 hover:scale-105"
            aria-label="Expandir barra lateral"
            title="Expandir barra lateral"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm select-none">
              AP
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm select-none">
                AP
              </div>
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-sm font-bold text-white tracking-tight truncate">ChatAP</span>
                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mt-0.5">Admin</span>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 cursor-pointer transition-colors duration-200 hover:bg-white/10 ml-auto"
              style={{ color: "var(--sidebar-text)" }}
              aria-label="Ocultar barra lateral"
              title="Ocultar barra lateral"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Navegación: flex-1, layout vertical estable */}
      <nav
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: "20px 0" }}
      >
        {sections.map((section) => {
          const visible = section.items.filter((it) => can(it.perm));
          if (!visible.length) return null;
          return (
            <div
              key={section.title}
              style={{ marginBottom: "24px" }}
            >
              <p
                className="h-[18px] mb-1.5 text-[10px] font-semibold uppercase tracking-widest overflow-hidden whitespace-nowrap transition-opacity duration-300"
                style={{
                  color: "var(--sidebar-section-text)",
                  opacity: open ? 1 : 0,
                  paddingLeft: "20px",
                }}
              >
                {section.title}
              </p>
              <div className="flex flex-col" style={{ rowGap: "6px" }}>
              {visible.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "group side-nav-link relative flex items-center rounded-xl no-underline",
                      "transition-colors duration-200",
                      isActive ? "font-semibold" : "font-medium",
                      !open && "sidebar-tooltip",
                    ].join(" ")
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive
                      ? "var(--sidebar-active-bg)"
                      : "transparent",
                    color: isActive
                      ? "var(--sidebar-active-text)"
                      : "var(--sidebar-text)",
                    padding: open ? "12px 20px" : "12px 0",
                    columnGap: open ? "14px" : "0",
                    justifyContent: open ? "flex-start" : "center",
                  })}
                  data-tooltip={!open ? link.label : undefined}
                  onMouseEnter={(e) => {
                    if (!isLinkActive(link)) {
                      e.currentTarget.style.backgroundColor =
                        "var(--sidebar-hover)";
                      e.currentTarget.style.color = "var(--sidebar-text-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLinkActive(link)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--sidebar-text)";
                    }
                  }}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ backgroundColor: "var(--sidebar-active-text)" }}
                        />
                      )}
                      <span className="relative shrink-0">
                        <span
                          className="nav-icon-ring pointer-events-none absolute left-1/2 top-1/2 w-[150%] h-[150%] rounded-full"
                          style={{ border: "2px solid var(--sidebar-active-bg)" }}
                        />
                        <SidebarIcon path={link.icon} className="nav-icon" />
                      </span>
                      <span
                        className={`truncate text-sm whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-200 ${
                          open ? "opacity-100 max-w-40" : "opacity-0 max-w-0"
                        }`}
                      >
                        {link.label}
                      </span>
                      {isActive && (
                        <span
                          className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 transition-opacity duration-300 ${
                            open ? "opacity-100" : "opacity-0"
                          }`}
                          style={{ backgroundColor: "var(--sidebar-active-text)" }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer: navegación secundaria y avatar anclados abajo. */}
      <div
        className="border-t shrink-0"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div style={{ padding: "18px 0" }}><NavLink
            to="/"
            className={() =>
              [
                "group side-nav-link flex items-center rounded-lg no-underline",
                "transition-colors duration-200",
                !open && "sidebar-tooltip",
              ].join(" ")
            }
            style={({ isActive }) => ({
              color: isActive
                ? "var(--sidebar-text-hover)"
                : "var(--sidebar-text)",
              backgroundColor: isActive ? "var(--sidebar-hover)" : "transparent",
              padding: open ? "12px 20px" : "12px 0",
              columnGap: open ? "14px" : "0",
              justifyContent: open ? "flex-start" : "center",
            })}
            data-tooltip={!open ? "Volver al inicio" : undefined}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--sidebar-hover)";
              e.currentTarget.style.color = "var(--sidebar-text-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--sidebar-text)";
            }}
          >
            <span className="relative shrink-0">
              <span
                className="nav-icon-ring pointer-events-none absolute left-1/2 top-1/2 w-[150%] h-[150%] rounded-full"
                style={{ border: "2px solid var(--sidebar-active-bg)" }}
              />
              <SidebarIcon path="M10 19l-7-7m0 0l7-7m-7 7h18" className="nav-icon" />
            </span>
            <span
              className={`text-xs font-semibold uppercase tracking-wide truncate whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-200 ${
                open ? "opacity-100 max-w-40" : "opacity-0 max-w-0"
              }`}
            >
              Volver al inicio
            </span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}