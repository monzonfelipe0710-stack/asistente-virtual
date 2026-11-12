import https from "node:https";
import { XMLParser } from "fast-xml-parser";

const TURNOS_URL = process.env.TURNOS_URL;
const TIMEOUT_MS = 10000;
const parser = new XMLParser();

// El padrón responde con encabezados que no cumplen HTTP/1.1 y fetch (undici) los
// rechaza con "Missing expected CR after header value". El parser permisivo se
// habilita solo en esta request, no en todo el proceso.
const postFormulario = (url, campos) =>
  new Promise((resolve, reject) => {
    const cuerpo = new URLSearchParams(campos).toString();
    const req = https.request(
      url,
      {
        method: 'POST',
        insecureHTTPParser: true,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Content-Length': Buffer.byteLength(cuerpo),
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/xml, text/xml, */*; q=0.01',
          'Referer': 'https://www.formosa.gob.ar/turnos',
          'Origin': 'https://www.formosa.gob.ar',
        },
      },
      (res) => {
        res.setEncoding('utf8');
        let texto = '';
        res.on('data', (parte) => { texto += parte; });
        res.on('end', () => resolve({ status: res.statusCode, texto }));
        res.on('error', reject);
      },
    );
    req.on('error', reject);
    req.end(cuerpo);
  });

const SEXOS_DEL_PADRON = ['M', 'F'];

export const buscarPersona = async (dni, sexo) => {
  if (!SEXOS_DEL_PADRON.includes(sexo)) {
    throw new Error(`El padrón de turnos solo acepta sexo M o F, no "${sexo}".`);
  }

  let resp;
  try {
    resp = await postFormulario(TURNOS_URL, { dni: String(dni), sexo });
  } catch (err) {
    throw new Error(`No se pudo consultar el padrón de turnos: ${err.message}`);
  }

  if (resp.status < 200 || resp.status >= 300) {
    throw new Error(`El padrón de turnos respondió con estado ${resp.status}.`);
  }

  const r = parser.parse(resp.texto)?.result;

  // Respondió bien pero no encontró a la persona.
  if (!r || r.resultid !== 'done' || !r.nombre) return null;

  const nombre = String(r.nombre).trim();
  const apellido = String(r.apellido ?? '').trim();
  const nombreCompleto = `${nombre} ${apellido}`.trim();

  // El padrón responde "done" con relleno ("SIN DATOS" o "." en nombre y apellido)
  // cuando el DNI no existe. Usamos ese centinela como criterio, no el CUIL vacío,
  // para no rechazar por error a alguien real que no lo tenga cargado.
  if (/\bsin\s+datos\b/i.test(nombreCompleto) || !/\p{L}/u.test(nombreCompleto)) return null;

  return {
    nombre,
    apellido,
    nombreCompleto,
    cuil: r.cuil != null ? String(r.cuil) : null,
  };
};