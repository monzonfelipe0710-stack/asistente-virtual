import { XMLParser } from "fast-xml-parser";

const TURNOS_URL = process.env.TURNOS_URL;
const parser = new XMLParser();

export const buscarPersona = async (dni, sexo) => {
  let resp;
  try {
    resp = await fetch(TURNOS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/xml, text/xml, */*; q=0.01",
        Referer: "https://www.formosa.gob.ar/turnos",
        Origin: "https://www.formosa.gob.ar",
      },
      body: new URLSearchParams({ dni: String(dni), sexo }),
    });
  } catch (err) {
    console.error('Error consultando turnos:', err.message);
    return null;
  }

  if (!resp.ok) return null;

  const r = parser.parse(await resp.text())?.result;
  if (!r || r.resultid !== 'done' || !r.nombre) return null;

  const nombre = String(r.nombre).trim();
  const apellido = String(r.apellido ?? '').trim();

  return {
    nombre,
    apellido,
    nombreCompleto: `${nombre} ${apellido}`.trim(),
    cuil: r.cuil != null ? String(r.cuil) : null,
  };
};