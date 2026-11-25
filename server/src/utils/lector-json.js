// Lee de a pedazos el objeto JSON que el modelo manda por streaming con el esquema de salida. Los
// campos de decisión (`camposMeta`) se juntan y salen una sola vez, cuando están todos; el string de
// `campoTexto` se decodifica a medida que llega, sin esperar a que cierre. El texto nunca sale antes
// que la meta: si el modelo lo mandara primero, se retiene hasta tenerla. El resultado no depende de
// cómo llegue partido el JSON (un escape, un \uXXXX o un par sustituto pueden venir en dos pedazos).
const ESCAPES = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
const BLANCO = /[ \t\n\r]/;
const esAlto = (c) => c >= '\uD800' && c <= '\uDBFF';
const esBajo = (c) => c >= '\uDC00' && c <= '\uDFFF';

export const crearLectorDeSalida = ({ campoTexto, camposMeta }) => {
  let crudo = '';
  let estado = 'inicio';
  let rota = false;
  let clave = '';
  let valor = '';
  let profundidad = 0;
  let enCadena = false;
  let escapado = false;
  let hex = null;
  let altoPendiente = '';
  let textoVisto = false;
  let texto = '';
  let entregado = 0;
  let metaLista = false;
  const valores = Object.create(null);

  const unidad = (c) => {
    if (altoPendiente) {
      const alto = altoPendiente;
      altoPendiente = '';
      if (esBajo(c)) {
        texto += alto + c;
        return;
      }
      texto += alto;
    }
    if (esAlto(c)) altoPendiente = c;
    else texto += c;
  };

  const cerrarValor = () => {
    try {
      valores[clave] = JSON.parse(valor);
    } catch {
      rota = true;
    }
    estado = 'despues';
  };

  // Devuelve false si el carácter no se consumió (el que termina un número, true, false o null).
  const paso = (c) => {
    switch (estado) {
      case 'inicio':
        if (c === '{') estado = 'clave';
        else if (!BLANCO.test(c)) rota = true;
        return true;
      case 'clave':
        if (c === '"') {
          clave = '';
          escapado = false;
          estado = 'en_clave';
        } else if (c === '}') estado = 'fin';
        else if (!BLANCO.test(c)) rota = true;
        return true;
      case 'en_clave':
        if (escapado) escapado = false;
        else if (c === '\\') escapado = true;
        else if (c === '"') {
          try {
            clave = JSON.parse(`"${clave}"`);
          } catch {
            rota = true;
          }
          estado = 'dos_puntos';
          return true;
        }
        clave += c;
        return true;
      case 'dos_puntos':
        if (c === ':') estado = 'valor';
        else if (!BLANCO.test(c)) rota = true;
        return true;
      case 'valor':
        if (BLANCO.test(c)) return true;
        if (clave === campoTexto && c === '"') {
          if (textoVisto) rota = true;
          textoVisto = true;
          escapado = false;
          hex = null;
          estado = 'texto';
          return true;
        }
        if (clave in valores) rota = true;
        valor = c;
        enCadena = c === '"';
        escapado = false;
        profundidad = c === '{' || c === '[' ? 1 : 0;
        estado = 'en_valor';
        return true;
      case 'en_valor':
        if (enCadena) {
          valor += c;
          if (escapado) escapado = false;
          else if (c === '\\') escapado = true;
          else if (c === '"') {
            enCadena = false;
            if (profundidad === 0) cerrarValor();
          }
          return true;
        }
        if (profundidad === 0) {
          if (c === ',' || c === '}' || BLANCO.test(c)) {
            cerrarValor();
            return false;
          }
          valor += c;
          return true;
        }
        valor += c;
        if (c === '"') enCadena = true;
        else if (c === '{' || c === '[') profundidad++;
        else if ((c === '}' || c === ']') && --profundidad === 0) cerrarValor();
        return true;
      case 'texto':
        if (hex !== null) {
          hex += c;
          if (hex.length === 4) {
            if (/^[0-9a-fA-F]{4}$/.test(hex)) unidad(String.fromCharCode(Number.parseInt(hex, 16)));
            else rota = true;
            hex = null;
          }
        } else if (escapado) {
          escapado = false;
          if (c === 'u') hex = '';
          else if (c in ESCAPES) unidad(ESCAPES[c]);
          else rota = true;
        } else if (c === '\\') escapado = true;
        else if (c === '"') {
          texto += altoPendiente;
          altoPendiente = '';
          estado = 'despues';
        } else unidad(c);
        return true;
      case 'despues':
        if (c === ',') estado = 'clave';
        else if (c === '}') estado = 'fin';
        else if (!BLANCO.test(c)) rota = true;
        return true;
      default:
        if (!BLANCO.test(c)) rota = true;
        return true;
    }
  };

  return {
    // `meta` viene una sola vez, en el pedazo que la completa; `texto`, lo nuevo que se puede mandar.
    agregar(pedazo) {
      crudo += pedazo;
      let meta = null;
      for (let i = 0; i < pedazo.length && !rota; ) {
        if (paso(pedazo[i])) i++;
        if (!metaLista && !rota && estado === 'despues' && camposMeta.every((c) => c in valores)) {
          metaLista = true;
          meta = Object.fromEntries(camposMeta.map((c) => [c, valores[c]]));
        }
      }
      if (!metaLista || rota) return { meta, texto: '' };
      const nuevo = texto.slice(entregado);
      entregado = texto.length;
      return { meta, texto: nuevo };
    },
    // El objeto entero, o null si el JSON no parsea o no coincide con lo que se fue leyendo.
    cerrar() {
      let entera;
      try {
        entera = JSON.parse(crudo);
      } catch {
        return null;
      }
      if (rota || estado !== 'fin' || !metaLista || entregado !== texto.length) return null;
      if (entera === null || typeof entera !== 'object' || entera[campoTexto] !== texto) return null;
      if (camposMeta.some((c) => JSON.stringify(entera[c]) !== JSON.stringify(valores[c]))) return null;
      return entera;
    },
  };
};
