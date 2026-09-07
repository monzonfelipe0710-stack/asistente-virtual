// Preferencias por usuario (localStorage).
//   { theme: "light" | "dark" | "system" }

import { readJSON, writeJSON } from "./auth";

const PREFIX = "chatap.preferences.";

export const DEFAULT_PREFERENCES = {
  theme: "system",
};

function keyFor(userId) {
  return PREFIX + userId;
}

export function loadPreferences(userId) {
  if (!userId) return { ...DEFAULT_PREFERENCES };
  const stored = readJSON(keyFor(userId), {});
  return { ...DEFAULT_PREFERENCES, ...(stored && typeof stored === "object" ? stored : {}) };
}

export function savePreferences(userId, prefs) {
  if (!userId) return;
  writeJSON(keyFor(userId), { ...loadPreferences(userId), ...prefs });
}

export function deletePreferences(userId) {
  if (!userId) return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    /* noop */
  }
}

// Aplica el tema elegido al documento. Para "system" sigue a la media query,
// pero respeta un tema explícito guardado previamente por el toggle de tema.
export function applyTheme(theme) {
  try {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    let dark = false;
    if (theme === "dark") dark = true;
    else if (theme === "light") dark = false;
    else if (theme === "system") {
      // Si el usuario tocó el toggle de tema (guardó light/dark explícito),
      // mantenemos esa elección en lugar de saltar al esquema del SO.
      const storedExplicit = localStorage.getItem("theme");
      if (storedExplicit === "dark" || storedExplicit === "light") {
        dark = storedExplicit === "dark";
      } else {
        dark =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
    }
    root.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    /* noop */
  }
}

// Suscribe a cambios de media query cuando el usuario eligió "system".
export function watchSystemTheme(enabled) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (!mq.addEventListener) return () => {};
  const handler = (e) => {
    document.documentElement.classList.toggle("dark", e.matches);
    try {
      localStorage.setItem("theme", e.matches ? "dark" : "light");
    } catch {
      /* noop */
    }
  };
  if (enabled) mq.addEventListener("change", handler);
  return () => {
    try {
      mq.removeEventListener("change", handler);
    } catch {
      /* noop */
    }
  };
}