import { quitarEnlaces } from './enlaces.js';
import { quitarSaludosIniciales } from './saludo.js';
import { corregirTuteo } from './voseo.js';

// El texto del modelo se limpia por líneas completas: así un enlace o una forma de tuteo nunca
// quedan partidos entre dos deltas del streaming, y las dos rutas limpian exactamente igual. Una
// línea que queda vacía al limpiarla se descarta; las vacías de origen separan párrafos (como
// mucho una en blanco).
// No sale nada antes de la primera línea con texto ni después de la última.
// `alCorregirTuteo` recibe las formas de tuteo que se corrigieron (sirve para medir el prompt).
// `verificar` revisa la línea contra los datos de los trámites antes de sacar los enlaces (ver
// services/verificacion.service.js): puede corregir una oración o sacarla.
// Una línea que anuncia una lista ("…las siguientes direcciones:") espera a la siguiente: si la
// verificación sacó los ítems que venían y no quedó ninguno, se descarta.
const ITEM = /^\s*(?:[-*•]|\d+[.)])\s+/;

export const crearLimpiador = ({ saludo = '', alCorregirTuteo, verificar } = {}) => {
  let pendiente = '';
  let enBlanco = 0;
  let empezo = false;
  let encabezado = null;

  const emitir = (texto, blancos) => {
    const separacion = empezo ? '\n'.repeat(Math.min(blancos + 1, 2)) : '';
    empezo = true;
    return separacion + texto;
  };

  const resolverEncabezado = (quedaItem) => {
    if (encabezado === null) return '';
    const { texto, blancos, itemsQuitados } = encabezado;
    encabezado = null;
    return quedaItem || !itemsQuitados ? emitir(texto, blancos) : '';
  };

  const limpiarLinea = (cruda) => {
    if (!cruda.trim()) {
      if (empezo || encabezado) enBlanco++;
      return '';
    }
    const verificada = verificar ? verificar(cruda) : cruda;
    if (!verificada.trim()) {
      if (encabezado && ITEM.test(cruda)) encabezado.itemsQuitados = true;
      return '';
    }
    const { texto: enVoseo, formas } = corregirTuteo(quitarEnlaces(verificada));
    if (formas.length > 0) alCorregirTuteo?.(formas);
    let limpia = enVoseo;
    if (!empezo) limpia = quitarSaludosIniciales(limpia.trimStart(), saludo);
    limpia = limpia.trimEnd();
    if (!limpia.trim()) return '';

    const antes = resolverEncabezado(ITEM.test(limpia));
    const blancos = enBlanco;
    enBlanco = 0;
    if (limpia.endsWith(':')) {
      encabezado = { texto: limpia, blancos, itemsQuitados: false };
      return antes;
    }
    return antes + emitir(limpia, blancos);
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
      return ultima + resolverEncabezado(false);
    },
  };
};

export const limpiarCuerpo = (texto, opciones) => {
  const limpiador = crearLimpiador(opciones);
  return limpiador.agregar(texto) + limpiador.cerrar();
};
