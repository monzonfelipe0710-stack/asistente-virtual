import { NavLink, useLocation } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import ChatBotAvatar from "../ChatBotAvatar";

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
        to: "/admin/solicitudes",
        label: "Solicitudes",
        perm: "solicitudes",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
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
      className="fixed top-0 left-0 bottom-0 z-40 flex flex-col overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
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
      {/* Header: toggle de la barra. */}
      <div
        className="flex items-center shrink-0 overflow-hidden"
        style={{
          height: "72px",
          padding: "16px 0 0",
          paddingLeft: "20px",
          justifyContent: "flex-start",
        }}
      >
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0 cursor-pointer transition-colors duration-200 hover:opacity-80"
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
              style={{ marginBottom: "32px" }}
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
              <div className="flex flex-col" style={{ rowGap: "10px" }}>
              {visible.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "group side-nav-link relative flex items-center rounded-lg no-underline",
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
                    padding: "14px 20px",
                    columnGap: "16px",
                    justifyContent: "flex-start",
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
              padding: "14px 20px",
              columnGap: "16px",
              justifyContent: "flex-start",
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
              Volver al Chat
            </span>
          </NavLink>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ padding: open ? "0 20px 24px" : "0 0 24px" }}
          aria-label="Asistente virtual"
        >
          <ChatBotAvatar size={48} />
        </div>
      </div>
    </aside>
  );
}