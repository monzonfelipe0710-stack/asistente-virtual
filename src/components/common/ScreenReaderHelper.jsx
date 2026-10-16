import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useA11y from "../../hooks/useA11y";
import { speak } from "../../lib/speech";

// Palabras en español para los roles más comunes, así la persona escucha
// "Botón, Iniciar sesión" en lugar de un código técnico.
const ROLE_WORDS = {
  button: "Botón",
  link: "Enlace",
  menuitem: "Opción de menú",
  tab: "Pestaña",
  checkbox: "Casilla de verificación",
  radio: "Opción",
  switch: "Interruptor",
  textbox: "Campo de texto",
  searchbox: "Búsqueda",
  combobox: "Lista desplegable",
  listbox: "Lista",
  option: "Opción",
  heading: "Título",
  img: "Imagen",
  dialog: "Diálogo",
  article: "Sección",
};

function implicitRole(el) {
  const tag = el.tagName?.toLowerCase();
  if (tag === "a") return el.getAttribute("href") ? "link" : "";
  if (tag === "button") return "button";
  if (tag === "select") return "combobox";
  if (tag === "textarea") return "textbox";
  if (tag === "summary") return "button";
  if (/^h[1-6]$/.test(tag)) return "heading";
  if (tag === "input") {
    const type = (el.getAttribute("type") || "text").toLowerCase();
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    if (type === "submit" || type === "button" || type === "reset") return "button";
    if (type === "search") return "searchbox";
    return "textbox";
  }
  return "";
}

function labelTextFor(el) {
  let label = (el.getAttribute("aria-label") || "").trim();
  if (!label) {
    const ids = (el.getAttribute("aria-labelledby") || "").trim();
    if (ids) {
      label = ids
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || "")
        .join(" ")
        .trim();
    }
  }
  if (!label && el.id) {
    try {
      const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lbl) label = lbl.textContent.trim();
    } catch {
      /* selector no disponible */
    }
  }
  if (!label) label = (el.getAttribute("title") || el.getAttribute("placeholder") || "").trim();
  if (!label) label = (el.textContent || "").replace(/\s+/g, " ").trim();
  if (!label && el.value) label = String(el.value);
  return label.replace(/\s+/g, " ").slice(0, 140);
}

function stateFor(el, role) {
  if (role === "checkbox" || role === "switch" || role === "radio") {
    const aria = el.getAttribute("aria-checked");
    if (aria === "true") return "activado";
    if (aria === "false") return "desactivado";
    if (typeof el.checked === "boolean") return el.checked ? "activado" : "desactivado";
  }
  const expanded = el.getAttribute("aria-expanded");
  if (expanded === "true") return "desplegado";
  if (expanded === "false") return "plegado";
  if (el.getAttribute("aria-pressed") === "true") return "presionado";
  if (el.getAttribute("aria-current") && el.getAttribute("aria-current") !== "false") {
    return "actual";
  }
  return "";
}

/** Descripción hablada de un elemento: "Botón, Iniciar sesión". */
function describeElement(el) {
  if (!el || el === document.body) return "";
  const role = (el.getAttribute("role") || implicitRole(el) || "").toLowerCase();
  const label = labelTextFor(el);

  // Evitamos anunciar contenedores vacíos o texto suelto sin significado.
  const interactive =
    !!role &&
    ["button", "link", "menuitem", "tab", "checkbox", "radio", "switch", "textbox", "searchbox", "combobox", "listbox", "option", "dialog", "summary"].includes(role);
  if (!interactive && !label) return "";
  if (!interactive && !/^h[1-6]$/i.test(el.tagName || "") && role !== "heading") {
    // Sin rol reconocible ni encabezado: no lo anunciamos.
    return "";
  }

  const roleWord = ROLE_WORDS[role] || (role === "dialog" ? "Diálogo" : "Elemento");
  const state = stateFor(el, role);
  return [roleWord, label, state].filter(Boolean).join(", ");
}

/**
 * Guía hablada para personas ciegas: con el "Modo lector de pantalla" activo,
 * al mover el foco (por ejemplo con la tecla TAB) se anuncia en voz alta dónde
 * está la persona y el estado del elemento. También lee el título de cada
 * página al navegar.
 */
export default function ScreenReaderHelper() {
  const { screenReader } = useA11y();
  const location = useLocation();

  useEffect(() => {
    if (!screenReader) return;
    let lastEl = null;
    let lastAt = 0;
    let timer = 0;

    const onFocus = (event) => {
      const el = event.target;
      if (!el || el === lastEl) return;
      lastEl = el;
      const now = Date.now();
      if (now - lastAt < 250) return;
      lastAt = now;
      const text = describeElement(el);
      if (text) {
        clearTimeout(timer);
        timer = window.setTimeout(() => speak(text), 60);
      }
    };

    document.addEventListener("focusin", onFocus, true);
    return () => {
      document.removeEventListener("focusin", onFocus, true);
      clearTimeout(timer);
    };
  }, [screenReader]);

  // Al cambiar de página, anunciamos el título principal para orientar.
  useEffect(() => {
    if (!screenReader) return;
    const timer = window.setTimeout(() => {
      const heading = document.querySelector("main h1, h1");
      const text = (heading?.textContent || "").replace(/\s+/g, " ").trim();
      if (text) speak(`Página: ${text}`);
    }, 320);
    return () => clearTimeout(timer);
  }, [screenReader, location.pathname]);

  return null;
}
