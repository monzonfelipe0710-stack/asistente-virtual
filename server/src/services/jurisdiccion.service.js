import prisma from '../config/prisma.js';
import * as cache from './cache.service.js';
import { asegurarCacheVigente } from './version-catalogo.service.js';

export const JURISDICCION_POR_DEFECTO = 'PROVINCIAL';

const NOMBRES = { PROVINCIAL: 'provincial', MUNICIPAL: 'municipal', NACIONAL: 'nacional' };

// "municipal, Clorinda" o "provincial".
export const describirJurisdiccion = ({ jurisdiccion, localidad }) =>
  [NOMBRES[jurisdiccion] ?? NOMBRES[JURISDICCION_POR_DEFECTO], localidad].filter(Boolean).join(', ');

// Cada campo sale del propio sector o, si es null, del ancestro más cercano que lo tenga; sin
// ninguno, provincial y sin localidad. Los dos se resuelven por separado: una delegación
// provincial puede tener localidad propia.
export const resolverJurisdicciones = (sectores) => {
  const porId = new Map(sectores.map((s) => [s.id, s]));
  const heredado = (sector, campo) => {
    const vistos = new Set();
    for (let s = sector; s && !vistos.has(s.id); s = porId.get(s.parentId)) {
      vistos.add(s.id);
      if (s[campo] != null) return s[campo];
    }
    return null;
  };
  const raizDe = (sector) => {
    const vistos = new Set();
    let s = sector;
    while (porId.has(s.parentId) && !vistos.has(s.id)) {
      vistos.add(s.id);
      s = porId.get(s.parentId);
    }
    return s === sector ? null : s.nombre;
  };
  return new Map(
    sectores.map((s) => {
      const raiz = raizDe(s);
      return [
        s.id,
        {
          nombre: s.nombre,
          jurisdiccion: heredado(s, 'jurisdiccion') ?? JURISDICCION_POR_DEFECTO,
          localidad: heredado(s, 'localidad'),
          ...(raiz && { raiz }),
        },
      ];
    }),
  );
};

// "Dirección de Obras Privadas, Municipalidad de la Ciudad de Formosa": el sector y, si depende de
// otro, el organismo del que depende.
export const nombreConRaiz = ({ nombre, raiz }) => (raiz && raiz !== nombre ? `${nombre}, ${raiz}` : nombre);

export const leerSectoresParaResolver = () =>
  prisma.sector.findMany({ select: { id: true, nombre: true, parentId: true, jurisdiccion: true, localidad: true } });

export const obtenerJurisdicciones = async () => {
  await asegurarCacheVigente();
  const cacheado = cache.obtenerJurisdicciones();
  if (cacheado) return cacheado;
  const valor = resolverJurisdicciones(await leerSectoresParaResolver());
  cache.guardarJurisdicciones(valor);
  return valor;
};

// Ids del sector y de todos sus descendientes.
export const subarbol = (sectores, id) => {
  const ids = new Set([id]);
  for (let cambio = true; cambio; ) {
    cambio = false;
    for (const s of sectores) {
      if (s.parentId != null && ids.has(s.parentId) && !ids.has(s.id)) {
        ids.add(s.id);
        cambio = true;
      }
    }
  }
  return ids;
};

// Un sector municipal tiene que tener localidad, propia o heredada. Se revisa el sector que
// cambia y sus descendientes, con el cambio aplicado en memoria.
export const municipalSinLocalidad = (sectores, id) => {
  const resueltas = resolverJurisdicciones(sectores);
  return [...subarbol(sectores, id)].find((sid) => {
    const r = resueltas.get(sid);
    return r?.jurisdiccion === 'MUNICIPAL' && !r.localidad;
  });
};
