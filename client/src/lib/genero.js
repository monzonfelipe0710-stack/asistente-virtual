// Géneros: etiquetas visibles y códigos enviados al backend.
// Masculino = M, Femenino = F; Otro y Prefiero no decirlo = X.

const GENERO_LABELS = {
  M: "Masculino",
  F: "Femenino",
  X: "Otro / Prefiero no decirlo",
  Masculino: "Masculino",
  Femenino: "Femenino",
  Otro: "Otro",
  "Prefiero no decirlo": "Prefiero no decirlo",
};

const GENERO_CODES = {
  Masculino: "M",
  Femenino: "F",
  Otro: "X",
  "Prefiero no decirlo": "X",
};

/** Devuelve la etiqueta legible del género. */
export function generoLabel(genero) {
  if (!genero) return "";
  return GENERO_LABELS[genero] || genero;
}

/** Convierte la opción visible al código esperado por el backend. */
export function generoCode(valor) {
  if (!valor) return "";
  return GENERO_CODES[valor] || valor;
}
