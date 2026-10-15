import { useEffect, useRef, useState } from "react";
import { readA11y, saveA11y } from "../../lib/accessibility";

const TEXT_OPTIONS = [
  { id: "normal", label: "Normal", preview: "0.85rem" },
  { id: "large", label: "Grande", preview: "1rem" },
  { id: "xlarge", label: "Muy grande", preview: "1.2rem" },
  { id: "huge", label: "Enorme", preview: "1.4rem" },
];

const A11Y_ICON = (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="7.4" r="1.4" fill="currentColor" stroke="none" />
    <path strokeLinecap="round" d="M7.4 10.2h9.2M12 10.5v3.2m0 0-1.6 4.4m1.6-4.4 1.6 4.4" />
  </svg>
);

function Switch({ checked, label, hint, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 rounded-xl border border-line bg-mist/40 px-3.5 py-3 text-left hover:bg-mist transition-colors cursor-pointer"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-muted mt-0.5">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand-deep" : "bg-line"
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked ? "left-[1.125rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

/**
 * Menú de accesibilidad global. Botón flotante discreto (abajo a la izquierda)
 * que abre un panel para agrandar el texto, activar alto contraste o una
 * tipografía más legible. Las preferencias se recuerdan en el navegador.
 */
export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => readA11y());
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    saveA11y(prefs);
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    }
    function onPointer(e) {
      if (
        !panelRef.current?.contains(e.target) &&
        !btnRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function update(patch) {
    setPrefs((p) => ({ ...p, ...patch }));
  }

  function reset() {
    setPrefs({ text: "normal", contrast: false, readable: false });
  }

  const activeCount =
    (prefs.text !== "normal" ? 1 : 0) +
    (prefs.contrast ? 1 : 0) +
    (prefs.readable ? 1 : 0);
  const currentLabel =
    TEXT_OPTIONS.find((o) => o.id === prefs.text)?.label || "Normal";

  return (
    <div className="fixed bottom-4 left-4 z-40 print:hidden">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Opciones de accesibilidad"
          className="animate-scale-in absolute bottom-14 left-0 w-[19rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-paper p-4 shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand">
                {A11Y_ICON}
              </span>
              <h2 className="text-sm font-bold text-ink m-0">Accesibilidad</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar opciones de accesibilidad"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
            Tamaño del texto
          </p>
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-mist/40 p-1">
            {TEXT_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => update({ text: o.id })}
                aria-pressed={prefs.text === o.id}
                aria-label={`Tamaño del texto: ${o.label}`}
                title={o.label}
                style={{ fontSize: o.preview }}
                className={`flex h-9 items-center justify-center rounded-lg font-bold leading-none transition-colors cursor-pointer ${
                  prefs.text === o.id
                    ? "bg-brand-deep text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                A
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-1.5 mb-3">Actual: {currentLabel}</p>

          <div className="space-y-2">
            <Switch
              checked={prefs.contrast}
              label="Alto contraste"
              hint="Colores más fuertes y fondo blanco."
              onToggle={() => update({ contrast: !prefs.contrast })}
            />
            <Switch
              checked={prefs.readable}
              label="Letra más legible"
              hint="Tipografía clara y más espaciada."
              onToggle={() => update({ readable: !prefs.readable })}
            />
          </div>

          <button
            type="button"
            onClick={reset}
            disabled={activeCount === 0}
            className="mt-3 w-full rounded-xl border border-line py-2.5 text-xs font-semibold text-muted hover:text-ink hover:bg-mist transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Restablecer
          </button>
        </div>
      )}

      <button
        id="accessibility-menu"
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Opciones de accesibilidad"
        title="Opciones de accesibilidad"
        className={`relative grid h-12 w-12 place-items-center rounded-full border shadow-lg transition-colors cursor-pointer ${
          activeCount > 0
            ? "bg-brand-deep text-white border-brand-deep"
            : "bg-paper text-ink border-line hover:bg-mist"
        }`}
      >
        {A11Y_ICON}
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>
    </div>
  );
}
