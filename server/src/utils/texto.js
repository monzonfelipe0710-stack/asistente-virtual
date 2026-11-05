const FIN_DE_ORACION = /[.!?…\n]/;

// Posición justo después del último fin de oración dentro de los primeros `limite`
// caracteres; 0 si no hay ninguno.
export const finDeUltimaOracion = (texto, limite = texto.length) => {
  for (let i = Math.min(limite, texto.length) - 1; i >= 0; i--) {
    if (FIN_DE_ORACION.test(texto[i])) return i + 1;
  }
  return 0;
};

// Corta en la última oración completa que entra en el tope. Si no hay ninguna, en la
// última palabra completa, con "…".
export const cortarEnOracion = (texto, tope) => {
  if (texto.length <= tope) return texto;
  const corte = finDeUltimaOracion(texto, tope);
  if (corte > 0) return texto.slice(0, corte).trimEnd();
  const espacio = texto.lastIndexOf(' ', tope - 1);
  return `${texto.slice(0, espacio > 0 ? espacio : tope - 1).trimEnd()}…`;
};

export const normalizarNombre = (nombre) =>
  String(nombre ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
