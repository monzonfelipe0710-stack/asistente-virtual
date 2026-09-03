import { useState, useRef, useEffect } from "react";

const mockNotifications = [
  { id: 1, title: "Nuevo expediente ingresado", desc: "EXP-2026-011 — Licencia por Enfermedad", type: "siged", time: "Hace 5 min" },
  { id: 2, title: "Usuario creado", desc: "Matías Sosa fue registrado en el sistema", type: "user", time: "Hace 15 min" },
  { id: 3, title: "Artículo modificado", desc: "¿Cómo solicito licencia anual? fue actualizado", type: "knowledge", time: "Hace 42 min" },
  { id: 4, title: "Documento subido", desc: "Formulario de Licencia Anual (PDF)", type: "document", time: "Hace 1 h" },
  { id: 5, title: "Configuración actualizada", desc: "Horario de atención modificado", type: "settings", time: "Hace 2 h" },
];

const typeColors = {
  siged: "bg-info",
  user: "bg-ok",
  knowledge: "bg-warn",
  document: "bg-info",
  settings: "bg-muted",
};

export default function NotificationCenter({ unread = 0 }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(new Set());
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = mockNotifications.length - read.size;

  function markAllRead() {
    setRead(new Set(mockNotifications.map((n) => n.id)));
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-paper/10 transition-colors cursor-pointer bg-transparent border-none">
        <svg className="w-5 h-5 text-paper/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-bad text-paper text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-primary">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 card card-border overflow-hidden z-50 animate-scale-in shadow-xl">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <h3 className="text-sm font-semibold text-primary m-0">Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent bg-transparent border-none cursor-pointer font-medium hover:underline">Marcar todas leídas</button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-line">
            {mockNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-8 h-8 text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <p className="text-sm text-muted font-medium">No hay notificaciones</p>
              </div>
            ) : (
              mockNotifications.map((n) => {
                const isRead = read.has(n.id);
                return (
                  <div key={n.id} className={`px-4 py-3 table-row ${isRead ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[n.type] || "bg-line"} ${isRead ? "" : "animate-pulse-dot"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs m-0 ${isRead ? "text-muted" : "text-ink font-semibold"}`}>{n.title}</p>
                        <p className="text-[10px] text-muted m-0 mt-0.5">{n.desc}</p>
                        <p className="text-[10px] text-muted m-0 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
