import { quitarEnlaces } from './enlaces.js';
import { quitarSaludosIniciales } from './saludo.js';
import { corregirTuteo } from './voseo.js';

// El texto del modelo se limpia por líneas completas: así un enlace o una forma de tuteo nunca
// quedan partidos entre dos deltas del streaming, y las dos rutas limpian exactamente igual. Una
// línea que queda vacía al limpiarla se descarta; las vacías de origen separan párrafos (como
// mucho una en blanco).
// No sale nada antes de la primera línea con texto ni después de la última.
// `alCorregirTuteo` recibe las formas de tuteo que se corrigieron (sirve para medir el prompt).
export const crearLimpiador = ({ saludo = '', alCorregirTuteo } = {}) => {
  let pendiente = '';
  let enBlanco = 0;
  let empezo = false;

  const limpiarLinea = (cruda) => {
    if (!cruda.trim()) {
      if (empezo) enBlanco++;
      return '';
    }
    const { texto: enVoseo, formas } = corregirTuteo(quitarEnlaces(cruda));
    if (formas.length > 0) alCorregirTuteo?.(formas);
    let limpia = enVoseo;
    if (!empezo) limpia = quitarSaludosIniciales(limpia.trimStart(), saludo);
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
