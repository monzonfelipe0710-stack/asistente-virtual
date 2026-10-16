import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, children, onConfirm, confirmText = "Confirmar", cancelText = "Cancelar", confirmDanger = false, showActions = true }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }
      // Trampa de foco: el foco no debe salir del diálogo mientras está abierto.
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="relative bg-paper rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-slide-up outline-none"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 id={titleId} className="text-base font-semibold text-primary m-0">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:text-ink cursor-pointer hover:bg-mist transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div id={descId} className={`text-sm text-muted leading-relaxed ${showActions ? "mb-6" : ""}`}>{children}</div>
        {showActions && (
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn-ghost">{cancelText}</button>
            <button
              onClick={() => { onConfirm?.(); onClose(); }}
              className={`inline-flex items-center min-h-11 px-5 text-sm font-medium text-white rounded-lg cursor-pointer transition-colors duration-200 ${
                confirmDanger
                  ? "bg-linear-to-r from-red-500 to-red-600 hover:shadow-md hover:shadow-red-200/50"
                  : "bg-linear-to-r from-primary to-primary-light hover:shadow-md"
              }`}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
