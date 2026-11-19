// Los tests escriben la salida del modelo por streaming como "línea META + texto". Con el esquema
// JSON (STREAM_ESQUEMA y STREAM_INCREMENTAL, default) el modelo manda un objeto con "respuesta" al
// final: `enElFormato` pasa esos pedazos al formato que corresponde a las banderas, con el texto
// cortado en los mismos lugares. Un Error en la lista sigue de largo (lo tira el mock).
const apagada = (nombre) => ['false', '0', 'no'].includes(process.env[nombre]?.trim().toLowerCase());
export const conEsquema = () => !apagada('STREAM_ESQUEMA') && !apagada('STREAM_INCREMENTAL');

const POR_DEFECTO = { tipo: 'respuesta', saludo: '', tramiteId: null, tramitesUsados: [], opciones: [] };
const escapar = (texto) => JSON.stringify(texto).slice(1, -1);

// El JSON del esquema hasta la comilla que abre "respuesta".
export const aperturaDe = (meta) => `${JSON.stringify({ ...POR_DEFECTO, ...meta }).slice(0, -1)},"respuesta":"`;
export const jsonDeSalida = (meta, cuerpo) => `${aperturaDe(meta)}${escapar(cuerpo)}"}`;

// La salida entera, para cortarla en cualquier posición, y de a pedazos con el texto ya partido.
export const crudoDe = (meta, cuerpo) => (conEsquema() ? jsonDeSalida(meta, cuerpo) : `${JSON.stringify(meta)}\n${cuerpo}`);
export const pedazosDe = (meta, partes) => [...enElFormato([`${JSON.stringify(meta)}\n`, ...partes])];

export function* enElFormato(pedazos) {
  if (!conEsquema()) {
    yield* pedazos;
    return;
  }
  let linea = '';
  let abierta = false;
  for (const p of pedazos) {
    if (typeof p !== 'string') yield p;
    else if (abierta) yield escapar(p);
    else {
      linea += p;
      const nl = linea.indexOf('\n');
      if (nl === -1) continue;
      abierta = true;
      yield aperturaDe(JSON.parse(linea.slice(0, nl))) + escapar(linea.slice(nl + 1));
    }
  }
  yield abierta ? '"}' : jsonDeSalida(JSON.parse(linea), '');
}
