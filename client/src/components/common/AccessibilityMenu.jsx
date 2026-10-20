import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { readA11y, saveA11y } from "../../lib/accessibility";
import { speak, stopSpeaking } from "../../lib/speech";
import useTheme from "../../hooks/useTheme";

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
  const hintId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={hintId}
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 rounded-xl border border-line bg-mist/40 px-3.5 py-3 text-left hover:bg-mist transition-colors cursor-pointer"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span id={hintId} className="block text-xs text-muted mt-0.5">{hint}</span>
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
 * Menú de accesibilidad que abre un panel para agrandar el texto, activar
 * alto contraste, una tipografía más legible o el modo lector de pantalla.
 * Las preferencias se recuerdan en el navegador.
 */
export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => readA11y());
  const [navAnchor, setNavAnchor] = useState(null);
  const [panelPosition, setPanelPosition] = useState({
    top: 0,
    left: 0,
    maxHeight: "calc(100dvh - 1.5rem)",
  });
  const panelRef = useRef(null);
  const btnRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    const updateAnchor = () => {
      setNavAnchor(document.getElementById("accessibility-menu-anchor"));
    };
    const observer = new MutationObserver(updateAnchor);
    observer.observe(document.body, { childList: true, subtree: true });
    updateAnchor();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    saveA11y(prefs);
  }, [prefs]);

  useLayoutEffect(() => {
    if (!open) return;

    function positionPanel() {
      const trigger = btnRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const margin = 12;
      const left = Math.max(
        margin,
        Math.min(trigger.right - panel.offsetWidth, window.innerWidth - panel.offsetWidth - margin)
      );
      const top = trigger.bottom + 8;
      const maxHeight = Math.max(
        120,
        Math.min(panel.scrollHeight, window.innerHeight - top - margin)
      );
      setPanelPosition({ top, left, maxHeight: `${maxHeight}px` });
    }

    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open, navAnchor]);

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

  // El modo lector de pantalla da feedback hablado al instante, en cualquier
  // página, para que la persona sepa que quedó activado o desactivado.
  function toggleScreenReader() {
    const next = !prefs.screenReader;
    update({ screenReader: next });
    if (next) {
      speak(
        "Modo lector de pantalla activado. Usá la tecla TAB para recorrer la página: te voy a decir en qué elemento estás y leo las respuestas del asistente en voz alta."
      );
    } else {
      stopSpeaking();
    }
  }

  function reset() {
    if (prefs.screenReader) stopSpeaking();
    setPrefs({ text: "normal", contrast: false, readable: false, screenReader: false });
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    try {
      localStorage.setItem("theme", nextTheme);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
  }

  const activeCount =
    (prefs.text !== "normal" ? 1 : 0) +
    (prefs.contrast ? 1 : 0) +
    (prefs.readable ? 1 : 0) +
    (prefs.screenReader ? 1 : 0);
  const currentLabel =
    TEXT_OPTIONS.find((o) => o.id === prefs.text)?.label || "Normal";

  const panel = open && createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Opciones de accesibilidad"
      style={{
        top: panelPosition.top,
        left: panelPosition.left,
        maxHeight: panelPosition.maxHeight,
      }}
      className="animate-scale-in fixed z-[80] w-[19rem] max-w-[calc(100vw-2rem)] overflow-y-auto chat-scroll rounded-2xl border border-line bg-paper p-4 shadow-xl"
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

          <Switch
            checked={theme === "dark"}
            label="Modo oscuro"
            hint="Cambiar entre el tema claro y el oscuro."
            onToggle={toggleTheme}
          />

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
              checked={prefs.screenReader}
              label="Modo lector de pantalla"
              hint="Pensado para personas ciegas: lee en voz alta las respuestas y refuerza los avisos para NVDA, JAWS o VoiceOver."
              onToggle={toggleScreenReader}
            />
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
    </div>,
    document.body
  );

  const menu = (
    <div className={`print:hidden ${navAnchor ? "relative z-50" : "fixed top-4 right-4 z-40"}`}>
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

  return (
    <>
      {navAnchor ? createPortal(menu, navAnchor) : menu}
      {panel}
    </>
  );
}
