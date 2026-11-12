// Lo que escribe el modelo antes de llegar a la persona, igual en las dos rutas del chat: la ruta sin
// streaming le pasa la respuesta entera de una vez y el streaming, de a pedazos. El resultado no
// depende de cómo lleguen los pedazos, solo del texto. Dos etapas:
//   1. crearLimpiadorPorOraciones verifica y limpia cada oración en cuanto su corte ya no puede
//      cambiar (ver oracionesFirmes); las listas y la línea que las anuncia se retienen enteras.
//   2. crearLiberador decide qué de eso se puede mandar ya: al principio retiene hasta ver el idioma
//      y, si es una respuesta con trámite, hasta la primera oración con contenido; después, una
//      oración en otro idioma retiene el resto hasta el final. Una fuga corta en el pedazo que la trae.
import { quitarEnlaces } from '../utils/enlaces.js';
import { quitarSaludosIniciales } from '../utils/saludo.js';
import { corregirTuteo } from '../utils/voseo.js';
import { ITEM } from '../utils/cuerpo.js';
import { esOtroIdioma, pareceEspanol, predominaEspanol, tieneOtroIdioma } from '../utils/idioma.js';
import { MENSAJE_FUERA_DE_ALCANCE } from './guardrail.service.js';
import { MENSAJE_LISTA_COLAPSADA, itemVacio, oracionesFirmes, partirEnOraciones, sinContenidoPropio } from './verificacion.service.js';

// Una línea que todavía puede ser un ítem ("", "-", "12") no se empieza a mandar.
const PUEDE_SER_ITEM = /^\s*(?:[-*•]|\d+[.)]?)?$/;
const SIN_VERIFICAR = () => (o) => ({ texto: o.texto, cambio: false });

// Las reglas son las de utils/cuerpo.js, de a oración: sin enlaces del modelo, en voseo, sin saludo
// al principio, una lista con un ítem perdido colapsada en la frase fija y como mucho una línea en
// blanco entre párrafos. Dos diferencias: si la línea que anuncia una lista tiene varias oraciones,
// solo la última es el anuncio (las anteriores ya salieron), y las oraciones que quedan conservan el
// espacio original entre ellas. Devuelve listas de pedazos { texto, modelo }: el texto es una
// oración (con lo que la separa de la anterior), una lista entera o su anuncio; `modelo`, lo que
// escribió el modelo para llegar a ese texto, sin los reemplazos del servidor (para ver el idioma).
export const crearLimpiadorPorOraciones = ({ saludo = '', alCorregirTuteo, verificar } = {}) => {
  let pendiente = '';
  let linea = null;
  let enBlanco = 0;
  let empezo = false;
  let encabezado = null;
  let lista = null;
  let colapsada = false;
  let crudo = '';
  const pedazo = (texto) => {
    if (!texto) return null;
    const p = { texto, modelo: crudo };
    crudo = '';
    return p;
  };

  const emitir = (texto, blancos) => {
    const separacion = empezo ? '\n'.repeat(Math.min(blancos + 1, 2)) : '';
    empezo = true;
    return separacion + texto;
  };
  // El anuncio de una lista que estaba al final de una línea con otras oraciones sigue esa línea.
  const emitirAnuncio = ({ texto, blancos, enLinea }) => {
    if (!enLinea) return emitir(texto, blancos);
    empezo = true;
    return texto;
  };

  const soltarEncabezado = () => {
    if (encabezado === null) return '';
    const anuncio = encabezado;
    encabezado = null;
    return emitirAnuncio(anuncio);
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
    const cabecera = anuncio ? emitirAnuncio(anuncio) : '';
    return cabecera + lineas.map((l) => emitir(l.texto, l.blancos)).join('');
  };

  const limpiar = (texto) => {
    const { texto: enVoseo, formas } = corregirTuteo(quitarEnlaces(texto));
    if (formas.length > 0) alCorregirTuteo?.(formas);
    return enVoseo;
  };

  const pasarItem = (cruda) => {
    crudo += `${cruda}\n`;
    const verificada = verificar ? verificar(cruda) : cruda;
    const limpia = verificada.trim() ? limpiar(verificada).trimEnd() : '';
    if (lista === null) {
      lista = { encabezado, lineas: [], perdido: false, blancos: encabezado ? (encabezado.enLinea ? 0 : encabezado.blancos) : enBlanco };
      encabezado = null;
      if (lista.encabezado) enBlanco = 0;
    }
    if (!limpia.trim() || itemVacio(limpia)) lista.perdido = true;
    else lista.lineas.push({ texto: limpia, blancos: enBlanco });
    enBlanco = 0;
  };

  // Una línea que no es ítem cierra la lista anterior. El saludo se saca de la primera línea que se
  // procesa sin haber mandado nada todavía.
  const empezarLinea = () => {
    linea = { quitaSaludo: !empezo, revisar: verificar?.nuevaLinea() ?? SIN_VERIFICAR(), procesadas: 0, huboTexto: false, inicio: '', saludoListo: false, mando: false, blancos: 0 };
    return pedazo(cerrarLista());
  };

  const mandarDeLinea = (texto, esAnuncio) => {
    const salida = [];
    if (!linea.mando) {
      salida.push(pedazo(soltarEncabezado()));
      linea.blancos = enBlanco;
      enBlanco = 0;
    }
    if (esAnuncio) encabezado = { texto, blancos: linea.blancos, enLinea: linea.mando };
    else salida.push(pedazo(linea.mando ? emitirAnuncio({ texto, enLinea: true }) : emitir(texto, linea.blancos)));
    linea.mando = true;
    return salida;
  };

  const pasarOracion = (oracion, ultima) => {
    crudo += `${oracion.separador}${oracion.texto}`;
    const verificada = linea.revisar(oracion).texto;
    let texto = '';
    if (verificada.trim()) {
      texto = limpiar(`${linea.huboTexto ? oracion.separador : ''}${verificada}`);
      linea.huboTexto = true;
    }
    // Lo que el saludo puede llegar a sacar se retiene hasta que quede algo después.
    if (linea.quitaSaludo && !linea.saludoListo) {
      linea.inicio += texto;
      texto = quitarSaludosIniciales(linea.inicio.trimStart(), saludo);
      if (!texto.trim() && !ultima) return [];
      linea.saludoListo = true;
    }
    if (ultima) texto = texto.trimEnd();
    if (!texto.trim()) return [];
    return mandarDeLinea(texto, ultima && texto.endsWith(':'));
  };

  const avanzarLinea = () => {
    if (linea === null) {
      if (PUEDE_SER_ITEM.test(pendiente) || ITEM.test(pendiente)) return [];
      return [empezarLinea(), ...avanzarLinea()];
    }
    const firmes = oracionesFirmes(pendiente);
    const salida = [];
    for (let i = linea.procesadas; i < firmes.length; i++) salida.push(...pasarOracion(firmes[i], false));
    linea.procesadas = Math.max(linea.procesadas, firmes.length);
    return salida;
  };

  const terminarLinea = (cruda) => {
    if (linea === null) {
      if (!cruda.trim()) {
        crudo += '\n';
        if (empezo || encabezado || lista) enBlanco++;
        return [];
      }
      if (ITEM.test(cruda)) {
        pasarItem(cruda);
        return [];
      }
      return [empezarLinea(), ...terminarLinea(cruda)];
    }
    const oraciones = partirEnOraciones(cruda);
    const salida = [];
    for (let i = linea.procesadas; i < oraciones.length; i++) salida.push(...pasarOracion(oraciones[i], i === oraciones.length - 1));
    linea = null;
    crudo += '\n';
    return salida;
  };

  return {
    agregar(delta) {
      pendiente += delta;
      const salida = [];
      for (let nl = pendiente.indexOf('\n'); nl !== -1; nl = pendiente.indexOf('\n')) {
        salida.push(...terminarLinea(pendiente.slice(0, nl)));
        pendiente = pendiente.slice(nl + 1);
      }
      salida.push(...avanzarLinea());
      return salida.filter(Boolean);
    },
    // Al final va también lo que el modelo escribió y no llegó a ningún texto (lo que se sacó).
    cerrar() {
      const salida = [...terminarLinea(pendiente), pedazo(cerrarLista()), pedazo(soltarEncabezado())].filter(Boolean);
      pendiente = '';
      if (crudo) salida.push({ texto: '', modelo: crudo });
      crudo = '';
      return salida;
    },
  };
};

export const limpiarPorOraciones = (texto, opciones) => {
  const limpiador = crearLimpiadorPorOraciones(opciones);
  return [...limpiador.agregar(texto), ...limpiador.cerrar()].map((p) => p.texto).join('');
};

// Antes de mandar lo primero se retienen al menos estas palabras, que alcanzan para ver el idioma,
// salvo que lo retenido ya se vea en español.
export const PALABRAS_PARA_EL_IDIOMA = 12;
export const cuantasPalabras = (texto) => texto.match(/\p{L}+/gu)?.length ?? 0;

// `oculto`: no se manda nada hasta el final (una conversación, que se valida entera, o una respuesta
// sin trámite, que no muestra el texto del modelo). `retenerContenido`: una respuesta con trámite no
// empieza a salir hasta tener una oración que responda (si la verificación saca todo, va el mensaje
// seguro sin haber mandado relleno). `buscarFuga` devuelve el fragmento copiado de las instrucciones
// o null. `agregar` devuelve lo que se puede mandar ya; `cerrar`, la decisión sobre el resto:
//   fuera_de_alcance / otro_idioma: no se mandó nada y todo se reemplaza por el mensaje fijo;
//   cortada: lo mandado queda (no tenía nada malo) y el resto se reemplaza por el mensaje fijo;
//   retenida / liberada: `texto` es lo que falta mandar y `cuerpo`, todo el texto.
export const crearLiberador = ({ oculto = false, retenerContenido = false, buscarFuga = () => null } = {}) => {
  let cuerpo = '';
  let retenido = '';
  let liberado = false;
  // Lo retenido desde la primera oración en otro idioma, después de haber mandado algo.
  let extranjero = false;
  let fuga = null;
  // El idioma se cuenta sobre lo que escribió el modelo: una oración que el servidor reemplazó (el
  // costo, en español) no tapa una respuesta en otro idioma.
  let modelo = '';
  let modeloRetenido = '';

  const primeraVez = () => {
    if (retenerContenido && sinContenidoPropio(retenido)) return false;
    if (MENSAJE_FUERA_DE_ALCANCE.startsWith(retenido.trim())) return false;
    if (!predominaEspanol(modeloRetenido)) return false;
    return cuantasPalabras(modeloRetenido) >= PALABRAS_PARA_EL_IDIOMA || pareceEspanol(modeloRetenido);
  };

  return {
    agregar({ texto, modelo: delModelo = texto }) {
      if (fuga !== null) return [];
      cuerpo += texto;
      modelo += delModelo;
      fuga = buscarFuga(cuerpo);
      if (fuga !== null) return [];
      if (oculto || extranjero || (liberado && tieneOtroIdioma(delModelo))) {
        // Lo del modelo retenido antes de empezar no cuenta para la cola en otro idioma.
        if (liberado && !extranjero) modeloRetenido = '';
        extranjero ||= liberado;
        retenido += texto;
        modeloRetenido += delModelo;
        return [];
      }
      if (liberado) return texto ? [texto] : [];
      retenido += texto;
      modeloRetenido += delModelo;
      if (!retenido || !primeraVez()) return [];
      liberado = true;
      const todo = retenido;
      retenido = '';
      modeloRetenido = '';
      return [todo];
    },
    cerrar() {
      if (fuga !== null) return { decision: liberado ? 'cortada' : 'fuera_de_alcance', motivo: 'fuga', fragmento: fuga };
      if (!liberado) {
        if (cuerpo.trim() === MENSAJE_FUERA_DE_ALCANCE) return { decision: 'fuera_de_alcance', motivo: 'marca' };
        if (esOtroIdioma(modelo)) return { decision: 'otro_idioma', original: modelo };
        return { decision: 'retenida', texto: retenido, cuerpo };
      }
      // La cola se juzga también sola: una respuesta que empezó en español no la tapa.
      if (extranjero && (esOtroIdioma(modeloRetenido) || esOtroIdioma(modelo))) return { decision: 'cortada', motivo: 'idioma', original: modelo };
      return { decision: 'liberada', texto: retenido, cuerpo };
    },
    fuga: () => fuga,
  };
};
