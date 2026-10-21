// Géneros: texto visible ↔ código que usa el backend.
//
// El backend guarda un código de una letra en el enum "Genero":
//
//   M -> "Masculino"
//   F -> "Femenino"
//   O -> "Otro"
//   X -> "Prefiero no decirlo"
//
// Los códigos no cambian: el formulario convierte lo que la persona elige a
// código y la interfaz muestra el texto legible a partir del código.

const GENERO_LABELS = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
  X: "Prefiero no decirlo",
  // Variantes en palabras completas (datos de ejemplo y envío directo).
  Masculino: "Masculino",
  Femenino: "Femenino",
  Otro: "Otro",
  "Prefiero no decirlo": "Prefiero no decirlo",
};

const GENERO_CODES = {
  Masculino: "M",
  Femenino: "F",
  Otro: "O",
  "Prefiero no decirlo": "X",
};

/** Etiqueta legible de un género. Cualquier valor desconocido se devuelve tal cual. */
export function generoLabel(genero) {
  if (!genero) return "";
  return GENERO_LABELS[genero] || genero;
}

/** Convierte la opción elegida en el código que espera el backend. */
export function generoCode(valor) {
  if (!valor) return "";
  return GENERO_CODES[valor] || valor;
}
