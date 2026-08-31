import { NavLink, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

const sections = [
  {
    title: "PRINCIPAL",
    items: [
      {
        to: "/admin",
        label: "Dashboard",
        perm: "dashboard",
        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z",
      },
      {
        to: "/admin/mesa-de-entrada",
        label: "Mesa de Entradas",
        perm: "mesa_entrada",
        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      },
    ],
  },
  {
    title: "GESTIÓN",
    items: [
      {
        to: "/admin/usuarios",
        label: "Usuarios",
        perm: "usuarios",
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      },
      {
        to: "/admin/conocimiento",
        label: "Conocimiento",
        perm: "conocimiento",
        icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
      },
      {
        to: "/admin/documentos",
        label: "Documentos",
        perm: "documentos",
        icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
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
        label: "Configuración",
        perm: "configuracion",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z",
      },
      {
        to: "/admin/reportes",
        label: "Reportes",
        perm: "reportes",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
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

  const isLinkActive = (link) =>
    location.pathname === link.to ||
    (link.to !== "/admin" && location.pathname.startsWith(link.to));

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        width: open
          ? "var(--sidebar-width)"
          : "var(--sidebar-collapsed-width)",
      }}
      role="navigation"
      aria-label="Panel de administración"
    >
      {/* Header: Toggle + Logo */}
      <div
        className="flex items-center gap-3 px-3 py-4 border-b shrink-0 transition-colors duration-200"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 cursor-pointer transition-colors duration-200 hover:opacity-80"
          style={{
            backgroundColor: "var(--sidebar-hover)",
            color: "var(--sidebar-text)",
          }}
          aria-label={open ? "Ocultar barra lateral" : "Mostrar barra lateral"}
          title={!open ? "Mostrar barra lateral" : undefined}
        >
          <svg
            className="w-[18px] h-[18px] transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            style={{ transform: open ? "rotate(0deg)" : "rotate(180deg)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {open && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs"
              style={{ backgroundColor: "var(--sidebar-active-bg)" }}
            >
              AP
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span
                className="text-sm font-bold tracking-tight leading-none truncate opacity-0 animate-sidebar-expand-text"
                style={{ color: "var(--sidebar-text-hover)" }}
              >
                ChatAP
              </span>
              <span
                className="text-[10px] font-medium uppercase tracking-wider mt-0.5 truncate opacity-0 animate-sidebar-expand-text"
                style={{ color: "var(--sidebar-section-text)" }}
              >
                Administración
              </span>
            </div>
          </div>
        )}

        {!open && (
          <div className="flex items-center justify-center w-9 h-9 shrink-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-xs"
              style={{ backgroundColor: "var(--sidebar-active-bg)" }}
            >
              AP
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-5">
        {sections.map((section) => {
          const visible = section.items.filter((it) => can(it.perm));
          if (!visible.length) return null;
          return (
            <div key={section.title} className="space-y-1">
              {open && (
                <p
                  className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--sidebar-section-text)" }}
                >
                  {section.title}
                </p>
              )}
              {visible.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "group relative flex items-center gap-3 rounded-lg no-underline",
                      "transition-all duration-200",
                      isActive ? "font-semibold" : "font-medium",
                      open ? "px-3 py-2.5" : "justify-center mx-auto",
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
                    width: !open ? "44px" : undefined,
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
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{ backgroundColor: "var(--sidebar-active-text)" }}
                        />
                      )}
                      <span className="shrink-0 transition-transform duration-150 group-hover:scale-110">
                        <SidebarIcon path={link.icon} />
                      </span>
                      {open && (
                        <span className="truncate text-sm opacity-0 animate-sidebar-expand-text">
                          {link.label}
                        </span>
                      )}
                      {open && isActive && (
                        <span
                          className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: "var(--sidebar-active-text)" }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer: Volver al Chat */}
      <div
        className="border-t px-2.5 py-3"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <NavLink
          to="/"
          className={() =>
            [
              "group flex items-center gap-3 rounded-lg no-underline",
              "transition-all duration-200",
              open ? "px-3 py-2.5" : "justify-center mx-auto",
              !open && "sidebar-tooltip",
            ].join(" ")
          }
          style={({ isActive }) => ({
            color: isActive
              ? "var(--sidebar-text-hover)"
              : "var(--sidebar-text)",
            backgroundColor: isActive ? "var(--sidebar-hover)" : "transparent",
            width: !open ? "44px" : undefined,
          })}
          data-tooltip={!open ? "Volver al Chat" : undefined}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--sidebar-hover)";
            e.currentTarget.style.color = "var(--sidebar-text-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--sidebar-text)";
          }}
        >
          <span className="shrink-0 transition-transform duration-150 group-hover:scale-110">
            <SidebarIcon path="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </span>
          {open && (
            <span className="text-xs font-semibold uppercase tracking-wide truncate opacity-0 animate-sidebar-expand-text">
              Volver al Chat
            </span>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
