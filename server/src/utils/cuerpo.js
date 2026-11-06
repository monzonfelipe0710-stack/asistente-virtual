import { quitarEnlaces } from './enlaces.js';
import { quitarSaludosIniciales } from './saludo.js';
import { corregirTuteo } from './voseo.js';
import { MENSAJE_LISTA_COLAPSADA, itemVacio } from '../services/verificacion.service.js';

// El texto del modelo se limpia por líneas completas: así un enlace o una forma de tuteo nunca
// quedan partidos entre dos deltas del streaming, y las dos rutas limpian exactamente igual. Una
// línea que queda vacía al limpiarla se descarta; las vacías de origen separan párrafos (como
// mucho una en blanco).
// No sale nada antes de la primera línea con texto ni después de la última.
// `alCorregirTuteo` recibe las formas de tuteo que se corrigieron (sirve para medir el prompt).
// `verificar` revisa la línea contra los datos de los trámites antes de sacar los enlaces (ver
// services/verificacion.service.js): puede corregir una oración o sacarla.
// Una lista (ítems con viñeta o numerados) se retiene entera hasta que termina: si se perdió un
// ítem (la verificación lo sacó o quedó sin contenido útil) no sale la lista incompleta, sino una
// frase fija en su lugar, con la línea que la anunciaba ("…las siguientes direcciones:"). Una lista
// que sobrevive entera no se toca.
const ITEM = /^\s*(?:[-*•]|\d+[.)])\s+/;

export const crearLimpiador = ({ saludo = '', alCorregirTuteo, verificar } = {}) => {
  let pendiente = '';
  let enBlanco = 0;
  let empezo = false;
  let encabezado = null;
  let lista = null;
  let colapsada = false;

  const emitir = (texto, blancos) => {
    const separacion = empezo ? '\n'.repeat(Math.min(blancos + 1, 2)) : '';
    empezo = true;
    return separacion + texto;
  };

  const soltarEncabezado = () => {
    if (encabezado === null) return '';
    const { texto, blancos } = encabezado;
    encabezado = null;
    return emitir(texto, blancos);
  };

  const cerrarLista = () => {
    if (lista === null) return '';
    const { encabezado: anuncio, lineas, perdido, blancos } = lista;
    lista = null;
    if (perdido) {
      if (colapsada) return '';
      colapsada = true;
      return emitir(MENSAJE_LISTA_COLAPSADA, blancos);
    }
    const cabecera = anuncio ? emitir(anuncio.texto, anuncio.blancos) : '';
    return cabecera + lineas.map((l) => emitir(l.texto, l.blancos)).join('');
  };

  const limpiarLinea = (cruda) => {
    if (!cruda.trim()) {
      if (empezo || encabezado || lista) enBlanco++;
      return '';
    }
    const esItem = ITEM.test(cruda);
    const verificada = verificar ? verificar(cruda) : cruda;
    let limpia = '';
    if (verificada.trim()) {
      const { texto: enVoseo, formas } = corregirTuteo(quitarEnlaces(verificada));
      if (formas.length > 0) alCorregirTuteo?.(formas);
      limpia = enVoseo;
      if (!empezo && !esItem) limpia = quitarSaludosIniciales(limpia.trimStart(), saludo);
      limpia = limpia.trimEnd();
    }

    if (esItem) {
      if (lista === null) {
        lista = { encabezado, lineas: [], perdido: false, blancos: encabezado ? encabezado.blancos : enBlanco };
        encabezado = null;
        if (lista.lineas.length === 0 && lista.encabezado) enBlanco = 0;
      }
      if (!limpia.trim() || itemVacio(limpia)) lista.perdido = true;
      else lista.lineas.push({ texto: limpia, blancos: enBlanco });
      enBlanco = 0;
      return '';
    }

    const antesLista = cerrarLista();
    if (!limpia.trim()) return antesLista;
    const antesEncabezado = soltarEncabezado();
    const blancos = enBlanco;
    enBlanco = 0;
    if (limpia.endsWith(':')) {
      encabezado = { texto: limpia, blancos };
      return antesLista + antesEncabezado;
    }
    return antesLista + antesEncabezado + emitir(limpia, blancos);
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
      return ultima + cerrarLista() + soltarEncabezado();
    },
  };
};

export const limpiarCuerpo = (texto, opciones) => {
  const limpiador = crearLimpiador(opciones);
  return limpiador.agregar(texto) + limpiador.cerrar();
};
