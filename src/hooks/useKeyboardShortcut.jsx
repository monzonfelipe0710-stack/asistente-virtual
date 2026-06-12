import { useEffect } from "react";

const shortcuts = [];

export default function useKeyboardShortcut(key, ctrlKey, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (e.key === key && e.ctrlKey === ctrlKey && !e.repeat) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [key, ctrlKey, handler]);
}

export function KeyboardShortcutHelp({ open, onClose }) {
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const items = [
    { keys: "Ctrl + K", desc: "Abrir búsqueda global" },
    { keys: "Ctrl + N", desc: "Nuevo elemento (usuario/artículo)" },
    { keys: "Escape", desc: "Cerrar modal / menú" },
    { keys: "?", desc: "Ayuda de teclado" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="card card-border p-6 max-w-md w-full mx-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-primary m-0">Atajos de Teclado</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-2">
          {items.map(({ keys, desc }) => (
            <div key={keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-slate-600">{desc}</span>
              <kbd className="px-2 py-1 text-xs font-mono font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200">{keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
