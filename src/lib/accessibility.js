// Preferencias de accesibilidad del ciudadano (localStorage).
//   { text: "normal" | "large" | "xlarge" | "huge", contrast: boolean,
//     readable: boolean, screenReader: boolean }
//
// Se guardan en el navegador y se aplican como atributos en <html>, que el CSS
// usa para escalar el tamaño de letra, activar el alto contraste, una tipografía
// más legible o reforzar el uso con lector de pantalla. La pieza que las guarda
// es chica y global para que estén siempre a mano sin ensuciar la estética.

const STORAGE_KEY = "chatap_a11y";
const CHANGE_EVENT = "chatap:a11y-change";

export const DEFAULT_A11Y = {
  text: "normal",
  contrast: false,
  readable: false,
  screenReader: false,
};

export function readA11y() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_A11Y };
    return { ...DEFAULT_A11Y, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_A11Y };
  }
}

export function applyA11y(prefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!prefs.text || prefs.text === "normal") root.removeAttribute("data-a11y-text");
  else root.setAttribute("data-a11y-text", prefs.text);
  root.setAttribute("data-a11y-contrast", prefs.contrast ? "high" : "normal");
  root.setAttribute("data-a11y-readable", prefs.readable ? "true" : "false");
  root.setAttribute("data-a11y-sr", prefs.screenReader ? "true" : "false");
}

export function saveA11y(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* almacenamiento no disponible */
  }
  applyA11y(prefs);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: prefs }));
    } catch {
      /* CustomEvent no disponible */
    }
  }
}

/**
 * Se suscribe a los cambios de preferencias de accesibilidad, tanto dentro de
 * la misma pestaña (evento propio) como entre pestañas (evento "storage").
 * Devuelve la función para desuscribirse.
 */
export function subscribeA11y(callback) {
  if (typeof window === "undefined") return () => {};
  const onCustom = (event) => callback(event?.detail || readA11y());
  const onStorage = (event) => {
    if (!event.key || event.key === STORAGE_KEY) callback(readA11y());
  };
  window.addEventListener(CHANGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
