import { NavLink } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

const icon = (path) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
  </svg>
);

const sections = [
  {
    title: "Principal",
    items: [
      {
        to: "/admin",
        label: "Dashboard",
        perm: "dashboard",
        icon: icon("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"),
      },
      {
        to: "/admin/mesa-de-entrada",
        label: "Mesa de Entradas",
        perm: "mesa_entrada",
        icon: icon("M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"),
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        to: "/admin/usuarios",
        label: "Usuarios",
        perm: "usuarios",
        icon: icon("M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"),
      },
      {
        to: "/admin/conocimiento",
        label: "Conocimiento",
        perm: "conocimiento",
        icon: icon("M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"),
      },
      {
        to: "/admin/documentos",
        label: "Documentos",
        perm: "documentos",
        icon: icon("M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"),
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        to: "/admin/siged",
        label: "Integración SIGED",
        perm: "siged",
        icon: icon("M8 9l3 3-3 3m5 0h3M5 20h14a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v14a1 1 0 001 1z"),
      },
      {
        to: "/admin/configuracion",
        label: "Configuración",
        perm: "configuracion",
        icon: icon("M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"),
      },
      {
        to: "/admin/reportes",
        label: "Reportes",
        perm: "reportes",
        icon: icon("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"),
      },
    ],
  },
];

export default function AdminSidebar({ open, onToggle }) {
  const { can } = useAdmin();

  return (
    <aside className={`${open ? "translate-x-0 lg:w-64" : "-translate-x-full lg:translate-x-0 lg:w-0"} fixed inset-y-0 left-0 z-40 h-screen w-64 bg-ink text-paper flex flex-col flex-shrink-0 overflow-hidden transition-[width,transform] duration-300 ease-in-out lg:sticky lg:top-0`}>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-9 h-9 bg-brand-deep flex items-center justify-center rounded-lg flex-shrink-0">
          <span className="text-paper font-bold text-sm tracking-wide">AP</span>
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-sm font-bold uppercase tracking-wide">ChatAP</div>
          <div className="text-[10px] uppercase tracking-widest text-paper/60">Admin</div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="ml-auto grid h-8 w-8 flex-shrink-0 place-items-center rounded-md text-paper/60 transition-colors hover:bg-white/10 hover:text-paper"
          aria-label="Ocultar panel de navegación"
          aria-expanded={open}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-3 py-5">
        <div className="flex flex-col gap-6">
          {sections.map((section) => {
            const visible = section.items.filter((it) => can(it.perm));
            if (!visible.length) return null;
            return (
              <div key={section.title} className="flex flex-col gap-1.5">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-paper/40 mb-1">
                  {section.title}
                </p>
                <div className="flex flex-col gap-1.5">
                  {visible.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === "/admin"}
                      className={({ isActive }) =>
                          `group flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-md no-underline transition-all duration-200 whitespace-nowrap ${
                          isActive
                            ? "bg-brand-deep text-paper shadow-sm"
                            : "text-paper/80 hover:bg-white/10 hover:text-paper"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={isActive ? "text-paper" : "text-paper/70 group-hover:text-paper"}>
                            {link.icon}
                          </span>
                          <span className="truncate">{link.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-paper/90 animate-pulse-dot" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-paper/70 hover:text-paper transition-colors no-underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Chat
        </NavLink>
      </div>
    </aside>
  );
}
