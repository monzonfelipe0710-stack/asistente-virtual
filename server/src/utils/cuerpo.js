import { quitarEnlaces } from './enlaces.js';
import { quitarSaludoRepetido } from './saludo.js';

// El texto del modelo se limpia por líneas completas: así un enlace nunca queda partido entre
// dos deltas del streaming, y las dos rutas limpian exactamente igual. Una línea que queda vacía
// al limpiarla se descarta; las vacías de origen separan párrafos (como mucho una en blanco).
// No sale nada antes de la primera línea con texto ni después de la última.
export const crearLimpiador = ({ saludo = '' } = {}) => {
  let pendiente = '';
  let enBlanco = 0;
  let empezo = false;

  const limpiarLinea = (cruda) => {
    if (!cruda.trim()) {
      if (empezo) enBlanco++;
      return '';
    }
    let limpia = quitarEnlaces(cruda);
    if (!empezo) limpia = quitarSaludoRepetido(limpia.trimStart(), saludo);
    limpia = limpia.trimEnd();
    if (!limpia.trim()) return '';

    const separacion = empezo ? '\n'.repeat(Math.min(enBlanco + 1, 2)) : '';
    empezo = true;
    enBlanco = 0;
    return separacion + limpia;
  };

  return {
    agregar(delta) {
      const lineas = (pendiente + delta).split('\n');
      pendiente = lineas.pop();
      return lineas.map(limpiarLinea).join('');
    },
    cerrar() {
      const ultima = limpiarLinea(pendiente);
      pendiente = '';
      return ultima;
    },
  };
};

export const limpiarCuerpo = (texto, opciones) => {
  const limpiador = crearLimpiador(opciones);
  return limpiador.agregar(texto) + limpiador.cerrar();
};
