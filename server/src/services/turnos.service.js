import { XMLParser } from "fast-xml-parser";

const TURNOS_URL = process.env.TURNOS_URL;
const TIMEOUT_MS = 10000;
const parser = new XMLParser();

export const buscarPersona = async (dni, sexo) => {
  let resp;
  try {
    resp = await fetch(TURNOS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/xml, text/xml, */*; q=0.01',
        'Referer': 'https://www.formosa.gob.ar/turnos',
        'Origin': 'https://www.formosa.gob.ar',
      },
      body: new URLSearchParams({ dni: String(dni), sexo }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(`No se pudo consultar el padrón de turnos: ${err.message}`);
  }

  if (!resp.ok) {
    throw new Error(`El padrón de turnos respondió con estado ${resp.status}.`);
  }

  const r = parser.parse(await resp.text())?.result;

  // Respondió bien pero no encontró a la persona.
  if (!r || r.resultid !== 'done' || !r.nombre) return null;

  const nombre = String(r.nombre).trim();
  const apellido = String(r.apellido ?? '').trim();
  const nombreCompleto = `${nombre} ${apellido}`.trim();

  // El padrón responde "done" con relleno ("SIN DATOS") cuando el DNI no existe.
  // Usamos ese centinela como criterio, no el CUIL vacío, para no rechazar por
  // error a alguien real que no lo tenga cargado.
  if (/\bsin\s+datos\b/i.test(nombreCompleto)) return null;

  return {
    nombre,
    apellido,
    nombreCompleto,
    cuil: r.cuil != null ? String(r.cuil) : null,
  };
};