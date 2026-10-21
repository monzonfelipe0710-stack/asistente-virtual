import { XMLParser } from "fast-xml-parser";

const TURNOS_URL = process.env.TURNOS_URL;
const parser = new XMLParser();

// El padrón de turnos sólo indexa por sexo (M / F).
const SEXOS_PADRON = ['M', 'F'];

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

/**
 * Busca a la persona en el padrón de turnos usando el género declarado.
 *
 * El padrón sólo indexa por sexo (M / F). Cuando la persona declara un
 * género que no se corresponde con el del padrón ("Otro" u "Prefiero no
 * decirlo") se consulta con ambos sexos y se toma el primero que devuelva
 * datos: la verificación de identidad sigue siendo por DNI.
 */
export const buscarPersonaPorGenero = async (dni, genero) => {
  const sexos = SEXOS_PADRON.includes(genero) ? [genero] : SEXOS_PADRON;

  for (const sexo of sexos) {
    const persona = await buscarPersona(dni, sexo);
    if (persona) return persona;
  }

  return null;
};