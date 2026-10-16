import { useEffect, useState } from "react";
import { readA11y, subscribeA11y } from "../lib/accessibility";

/**
 * Devuelve las preferencias de accesibilidad activas y vuelve a renderizar
 * cuando cambian (por el menú de accesibilidad o desde otra pestaña).
 */
export default function useA11y() {
  const [prefs, setPrefs] = useState(() => readA11y());

  useEffect(() => subscribeA11y(setPrefs), []);

  return prefs;
}
