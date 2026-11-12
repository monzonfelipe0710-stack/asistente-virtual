import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { Jurisdiccion } from '@prisma/client';
import prisma from '../config/prisma.js';
import { reindexarCatalogo, tramitesDeSectores } from './embedding.service.js';
import { JURISDICCION_POR_DEFECTO, leerSectoresParaResolver, resolverJurisdicciones, subarbol } from './jurisdiccion.service.js';
import { normalizarNombre } from '../utils/texto.js';
import { marcarCatalogoCambiado } from './version-catalogo.service.js';
import { TOPES_CAMPOS, instruccionesEn, limpiarTexto } from './sanitizacion.service.js';
import { datosDeFicha } from './fichas.service.js';
import { grupoVacio, huellaDeGrupo, huellaDeMesa } from '../utils/huella.js';

const JURISDICCIONES = new Set(Object.values(Jurisdiccion));
export const EMAIL_SISTEMA = 'sistema@chatap.local';

const obtenerUsuarioSistema = async ({ simular }) => {
  const existente = await prisma.usuario.findUnique({ where: { email: EMAIL_SISTEMA } });
  if (existente || simular) return existente;

  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  return prisma.usuario.create({
    data: {
      nombre: 'Sistema',
      email: EMAIL_SISTEMA,
      passwordHash,
      rol: 'ADMINISTRADOR',
      estado: 'APROBADO', // no es logueable: password aleatorio
    },
  });
};

// Solo se escriben los campos que trae el JSON: un sector existente conserva lo que no venga.
const camposDeJurisdiccion = (s, log) => {
  const campos = {};
  if (s.jurisdiccion !== undefined) {
    if (s.jurisdiccion === null || JURISDICCIONES.has(s.jurisdiccion)) campos.jurisdiccion = s.jurisdiccion;
    else log.warn(`Jurisdicción inválida para el sector "${s.nombre}": ${s.jurisdiccion}`);
  }
  if (s.localidad !== undefined) campos.localidad = s.localidad?.trim() || null;
  return campos;
};

// Índice en el JSON del sector con ese nombre (y ese padre, si se indica). -1 si no hay
// exactamente uno: no existe o es ambiguo.
const buscarEnJson = (sectores, nombre, padre) => {
  const candidatos = sectores
    .map((s, i) => [s, i])
    .filter(([s]) => s.nombre === nombre && (padre === undefined || (s.padre ?? null) === padre));
  return candidatos.length === 1 ? candidatos[0][1] : -1;
};

// En una simulación, los sectores que se crearían reciben un id ficticio.
const esIdReal = (id) => typeof id === 'number';

// Los sectores se identifican por (nombre, padre); el padre tiene que estar en el mismo JSON
// y se crea antes que sus hijos.
const upsertSectores = async (sectores, log, { simular }) => {
  const ids = new Map();
  const resumen = { creados: 0, actualizados: 0 };
  const cambiados = [];
  const padres = sectores.map((s) => (s.padre ? buscarEnJson(sectores, s.padre) : null));
  let pendientes = sectores.map((_, i) => i).filter((i) => padres[i] !== -1);

  while (pendientes.length > 0) {
    const listos = pendientes.filter((i) => padres[i] === null || ids.has(padres[i]));
    if (listos.length === 0) break;

    for (const i of listos) {
      const s = sectores[i];
      const parentId = padres[i] === null ? null : ids.get(padres[i]);
      const campos = camposDeJurisdiccion(s, log);
      const existente = parentId === null || esIdReal(parentId)
        ? await prisma.sector.findFirst({ where: { nombre: s.nombre, parentId } })
        : null;

      if (existente) {
        if (Object.entries(campos).some(([campo, valor]) => existente[campo] !== valor)) {
          if (!simular) await prisma.sector.update({ where: { id: existente.id }, data: campos });
          resumen.actualizados++;
          cambiados.push(existente.id);
        }
        ids.set(i, existente.id);
      } else if (simular) {
        resumen.creados++;
        ids.set(i, `nuevo-${i}`);
      } else {
        const creado = await prisma.sector.create({
          data: {
            nombre: s.nombre,
            tipo: s.tipo,
            parentId,
            ...(parentId === null && { jurisdiccion: JURISDICCION_POR_DEFECTO }),
            ...campos,
          },
        });
        resumen.creados++;
        ids.set(i, creado.id);
      }
    }
    pendientes = pendientes.filter((i) => !listos.includes(i));
  }

  sectores.forEach((s, i) => {
    if (!ids.has(i)) log.warn(`Sector salteado: "${s.nombre}" (su padre "${s.padre}" no está en el JSON, es ambiguo o hay un ciclo)`);
  });
  return { ids, resumen, cambiados };
};

// Un trámite nombra su sector; si el nombre se repite entre sectores con distinto padre, tiene
// que traer `sectorPadre` (null para el sector raíz).
const sectorDelTramite = (t, sectores, ids) => {
  const i = buscarEnJson(sectores, t.sector, t.sectorPadre);
  return i === -1 ? null : ids.get(i) ?? null;
};

const avisarMunicipalesSinLocalidad = async (ids, log) => {
  const resueltas = resolverJurisdicciones(await leerSectoresParaResolver());
  for (const id of new Set(ids.values())) {
    const r = resueltas.get(id);
    if (r?.jurisdiccion === 'MUNICIPAL' && !r.localidad) log.warn(`El sector municipal "${r.nombre}" no tiene localidad.`);
  }
};

const claveDe = (sectorId, nombre) => `${sectorId}|${normalizarNombre(nombre)}`;

const agrupar = (lista, clave) => {
  const grupos = new Map();
  for (const x of lista) {
    const k = clave(x);
    grupos.set(k, [...(grupos.get(k) ?? []), x]);
  }
  return grupos;
};

const textoValido = (v) => typeof v === 'string' && v.trim().length > 0;

const reindexarPorDefecto = (ids, { lote, log }) => reindexarCatalogo({ ids, lote, log, continuarSiFalla: true });

// Los textos del JSON vienen de afuera: se limpian antes de comparar y de guardar. Los nombres de
// sectores se limpian igual en los sectores y en las referencias de los trámites, para que sigan
// coincidiendo. Lo que no es texto queda como vino (lo rechaza la validación de cada trámite).
const limpiarCatalogo = (datos) => {
  const recortados = [];
  const campo = (valor, campoNombre, de, { tope, multilinea = false }) => {
    if (typeof valor !== 'string') return valor;
    const { texto, recortado } = limpiarTexto(valor, { tope, multilinea });
    if (recortado) recortados.push({ nombre: de, campo: campoNombre, tope });
    return texto;
  };
  const nombre = { tope: TOPES_CAMPOS.nombre };
  // Lo que se toma de la ficha del portal, con los mismos topes que la carga manual. Un texto que
  // queda vacío después de limpiarlo es null.
  const ficha = (detalle, de) => {
    const f = datosDeFicha(detalle);
    const txt = (valor, campoNombre, tope, multilinea = false) =>
      (typeof valor === 'string' ? campo(valor, campoNombre, de, { tope, multilinea }) : null) || null;
    const mesa = (m) => ({
      origenId: m.origenId,
      nombre: txt(m.nombre, 'nombre de la mesa', TOPES_CAMPOS.mesa) ?? m.origenId,
      direccion: txt(m.direccion, 'dirección de la mesa', TOPES_CAMPOS.mesa),
      localidad: txt(m.localidad, 'localidad de la mesa', TOPES_CAMPOS.localidad),
      horario: txt(m.horario, 'horario de la mesa', TOPES_CAMPOS.mesa),
      telefono: txt(m.telefono, 'teléfono de la mesa', TOPES_CAMPOS.telefono),
      email: txt(m.email, 'email de la mesa', TOPES_CAMPOS.email),
    });
    return {
      ...f,
      costoDetalle: txt(f.costoDetalle, 'costoDetalle', TOPES_CAMPOS.costoDetalle, true),
      informacionAdicional: txt(f.informacionAdicional, 'informacionAdicional', TOPES_CAMPOS.informacionAdicional, true),
      requisitos: f.requisitos
        .map((r) => ({ descripcion: txt(r.descripcion, 'requisito', TOPES_CAMPOS.requisito, true) }))
        .filter((r) => r.descripcion),
      mesas: f.mesas.filter((m) => typeof m.origenId === 'string' && m.origenId.trim()).map(mesa),
      documentos: f.documentos
        .filter((d) => /^https?:\/\/\S+$/i.test(d.urlExterna ?? ''))
        .map((d) => ({ ...d, nombre: txt(d.nombre, 'nombre del documento', TOPES_CAMPOS.documento) ?? d.tipo })),
    };
  };
  const sectores = datos.sectores.map((s) => ({
    ...s,
    nombre: campo(s.nombre, 'nombre del sector', s.nombre, nombre),
    padre: campo(s.padre, 'padre', s.nombre, nombre),
    localidad: campo(s.localidad, 'localidad', s.nombre, { tope: TOPES_CAMPOS.localidad }),
  }));
  const tramites = datos.tramites.map((t) => (t && typeof t === 'object'
    ? {
      ...t,
      nombre: campo(t.nombre, 'nombre', t.nombre, nombre),
      descripcion: campo(t.descripcion, 'descripcion', t.nombre, { tope: TOPES_CAMPOS.descripcion, multilinea: true }),
      sector: campo(t.sector, 'sector', t.nombre, nombre),
      sectorPadre: campo(t.sectorPadre, 'sectorPadre', t.nombre, nombre),
      ficha: t.detalle && typeof t.detalle === 'object' ? ficha(t.detalle, t.nombre) : null,
    }
    : t));
  return { datos: { ...datos, sectores, tramites }, recortados };
};

// --- Datos de la ficha del portal --------------------------------------------------------------

const motivoFueraDelListado = (t) => {
  if (t.organismoIndexado === false) return 'su organismo no figura en el listado de organismos del sitio';
  if (t.errorFicha) return 'no figura en el listado y la ficha responde con la página de error del sitio';
  return 'no figura en el listado del sitio, aunque la ficha sigue completa';
};

// Grupos que vienen de la ficha. Los tres primeros entran en el texto del embedding.
const GRUPOS_FICHA = ['costo', 'informacionAdicional', 'requisitos', 'mesas', 'documentos'];
const DEL_EMBEDDING = new Set(['descripcion', 'costo', 'informacionAdicional', 'requisitos']);

// Un trámite es del importador si lo creó (encargado Sistema) o si tiene huella: asignarle un
// encargado desde el panel no lo vuelve manual.
const esDelImportador = (t, sistema) => Boolean((sistema && t.encargadoId === sistema.id) || t.huellaImportacion);

// Un grupo con huella se escribe si nadie lo cambió desde la última importación; sin huella (un
// trámite anterior a las huellas), solo si está vacío. La descripción sin huella es del importador,
// como antes de las huellas.
const puedeEscribir = (grupo, t) => {
  const huella = t.huellaImportacion?.[grupo];
  if (huella) return huella === huellaDeGrupo(grupo, t);
  return grupo === 'descripcion' || grupoVacio(grupo, t);
};

const valoresDeFicha = (f, mesaIds) => ({
  costo: f.costo,
  costoDetalle: f.costoDetalle,
  informacionAdicional: f.informacionAdicional,
  requisitos: f.requisitos,
  mesaIds,
  documentos: f.documentos,
});

// Los textos de la ficha que le llegan al modelo, para buscar frases con forma de instrucción.
const textosDeFicha = (f) => (f
  ? {
    requisitos: f.requisitos.map((r) => r.descripcion).join('\n'),
    informacionAdicional: f.informacionAdicional,
    costoDetalle: f.costoDetalle,
    mesas: f.mesas.map((m) => [m.nombre, m.direccion, m.localidad, m.horario, m.telefono, m.email].filter(Boolean).join(', ')).join('\n'),
    documentos: f.documentos.map((d) => d.nombre).join('\n'),
  }
  : {});

const camposDeMesa = (m) => ({
  nombre: m.nombre, direccion: m.direccion, localidad: m.localidad, horario: m.horario, telefono: m.telefono, email: m.email,
});

// Un trámite se escribe entero o no se escribe: una corrida cortada se retoma sin dejarlo a medias.
// Los documentos que se reemplazan son solo enlaces (los archivos subidos no se tocan).
// Si cambió algo del texto del embedding, el vector viejo se borra en la misma transacción: una
// corrida que se corta antes de reindexar deja el trámite con embedding null y la siguiente lo
// reindexa (mientras tanto, la búsqueda por palabras lo sigue encontrando).
const escribirTramite = (id, data, { requisitos, mesaIds, documentos }, { invalidarEmbedding = false } = {}) => prisma.$transaction(async (tx) => {
  if (Object.keys(data).length > 0) await tx.tramite.update({ where: { id }, data });
  if (invalidarEmbedding) await tx.$executeRaw`UPDATE tramites SET embedding = NULL WHERE id = ${id}`;
  if (requisitos) {
    await tx.requisito.deleteMany({ where: { tramiteId: id } });
    if (requisitos.length > 0) await tx.requisito.createMany({ data: requisitos.map((r) => ({ ...r, tramiteId: id })) });
  }
  if (mesaIds) {
    await tx.tramiteMesa.deleteMany({ where: { tramiteId: id } });
    if (mesaIds.length > 0) await tx.tramiteMesa.createMany({ data: mesaIds.map((mesaId) => ({ tramiteId: id, mesaId })), skipDuplicates: true });
  }
  if (documentos) {
    await tx.documento.deleteMany({ where: { tramiteId: id, archivo: null } });
    if (documentos.length > 0) await tx.documento.createMany({ data: documentos.map((d) => ({ ...d, tramiteId: id })) });
  }
});

// Importa sectores y trámites sin cortar la corrida: lo que no se puede escribir queda en
// `fallidos` y lo que pisaría un trámite ajeno, en `conflictos`. Un trámite cuyo nombre o
// descripción trae una frase con forma de instrucción para el asistente se crea o se actualiza sin
// publicar y queda en `paraRevisar`; uno sin cambios no se toca, pero también se informa.
//
// - `simular`: calcula el informe sin escribir ni llamar a la API de embeddings.
// - `despublicarFaltantes` (exige `completa`): despublica los trámites del importador que no
//   vinieron en el JSON, dentro de los sectores del JSON y sus descendientes. Nunca toca
//   trámites cargados a mano.
// - `publicar` en false deja los trámites nuevos como borradores (lo usan los tests).
// - `reindexar(ids, { lote, log })` devuelve `{ reindexados, fallidos }`.
// - `soloPorUrl`: cada trámite se identifica solo por su fuenteUrl, nunca por el nombre.
// - `fuenteDeFaltantes`: los faltantes que se despublican, además, tienen la fuenteUrl con ese prefijo.
export const importarCatalogo = async (crudos, {
  reindexar = reindexarPorDefecto,
  log = console,
  publicar = true,
  simular = false,
  completa = false,
  despublicarFaltantes = false,
  soloPorUrl = false,
  fuenteDeFaltantes = null,
  lote = 100,
} = {}) => {
  if (despublicarFaltantes && !completa) {
    throw new Error('despublicar faltantes exige una importación completa (--completa): con un JSON parcial se despublicaría el resto del catálogo.');
  }

  const { datos, recortados } = limpiarCatalogo(crudos);
  const sistema = await obtenerUsuarioSistema({ simular });
  const { ids, resumen: sectores, cambiados } = await upsertSectores(datos.sectores, log, { simular });
  if (!simular) await avisarMunicipalesSinLocalidad(ids, log);

  const existentes = await prisma.tramite.findMany({
    select: {
      id: true, nombre: true, descripcion: true, sectorId: true, fuenteUrl: true, encargadoId: true, publicado: true,
      costo: true, costoDetalle: true, informacionAdicional: true, verificadoEn: true, huellaImportacion: true,
      requisitos: { select: { descripcion: true, dondeSeConsigue: true, costo: true }, orderBy: { id: 'asc' } },
      mesas: { select: { mesaId: true } },
      documentos: { select: { nombre: true, archivo: true, urlExterna: true, tipo: true }, orderBy: { id: 'asc' } },
    },
  });
  const porUrl = new Map(existentes.filter((t) => t.fuenteUrl).map((t) => [t.fuenteUrl, t]));
  const porClave = agrupar(existentes, (t) => claveDe(t.sectorId, t.nombre));
  const sinEmbedding = new Set((await prisma.$queryRaw`SELECT id FROM tramites WHERE embedding IS NULL`).map((f) => f.id));
  const delImportador = (t) => esDelImportador(t, sistema);

  // El texto del embedding incluye el sector: si cambió la jurisdicción o la localidad de un
  // sector, se reindexan sus trámites y los de sus descendientes.
  const aIndexar = new Set(cambiados.length > 0 ? await tramitesDeSectores(cambiados) : []);
  const informe = {
    creados: [], actualizados: [], sinCambios: 0, reindexados: [], fallidos: [], conflictos: [], paraRevisar: [], recortados,
    despublicados: [], despublicacion: null, manuales: [], conservados: [], enlacesRotos: [], fueraDelListado: [],
    mesas: { creadas: 0, actualizadas: 0, conservadas: [] },
  };

  // Mesas de entrada del portal, una por oficina (origenId): se crean una vez y las comparten los
  // trámites. Una mesa que alguien editó a mano (no coincide su huella) no se pisa.
  const mesasPorOrigen = new Map((await prisma.mesaEntrada.findMany({ where: { origenId: { not: null } } })).map((m) => [m.origenId, m]));
  const mesasResueltas = new Map();
  const resolverMesa = async (m, sectorId) => {
    if (mesasResueltas.has(m.origenId)) return mesasResueltas.get(m.origenId);
    const existenteMesa = mesasPorOrigen.get(m.origenId);
    const campos = camposDeMesa(m);
    const huella = { datos: huellaDeMesa(campos) };
    let id;
    if (existenteMesa) {
      id = existenteMesa.id;
      if (existenteMesa.huellaImportacion?.datos !== huellaDeMesa(existenteMesa)) {
        if (huellaDeMesa(existenteMesa) !== huella.datos) informe.mesas.conservadas.push({ id, nombre: existenteMesa.nombre });
      } else if (existenteMesa.huellaImportacion.datos !== huella.datos) {
        if (!simular) await prisma.mesaEntrada.update({ where: { id }, data: { ...campos, huellaImportacion: huella } });
        informe.mesas.actualizadas++;
      }
    } else if (simular) {
      id = `nueva-${m.origenId}`;
      informe.mesas.creadas++;
    } else {
      id = (await prisma.mesaEntrada.create({
        data: { ...campos, origenId: m.origenId, sectorId: esIdReal(sectorId) ? sectorId : null, huellaImportacion: huella },
      })).id;
      informe.mesas.creadas++;
    }
    mesasResueltas.set(m.origenId, id);
    return id;
  };
  const resolverMesas = async (mesas, sectorId) => {
    const ids = [];
    for (const m of mesas) {
      const id = await resolverMesa(m, sectorId);
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  };
  const vistos = new Set();
  const urlsDelJson = new Set();
  const clavesDelJson = new Set();
  let noIdentificados = 0;

  const procesar = async (t, marcar) => {
    const fuenteUrl = typeof t.fuenteUrl === 'string' && t.fuenteUrl.trim() ? t.fuenteUrl.trim() : null;
    const conflicto = (motivo, existenteId = null) => informe.conflictos.push({ nombre: t.nombre, fuenteUrl, existenteId, motivo });
    const fallido = (motivo) => informe.fallidos.push({ nombre: t.nombre ?? null, fuenteUrl, motivo });

    if (fuenteUrl) {
      if (urlsDelJson.has(fuenteUrl)) return marcar(null, () => conflicto('fuenteUrl repetida en el JSON'));
      urlsDelJson.add(fuenteUrl);
    } else if (soloPorUrl) {
      return marcar(null, () => fallido('falta la fuenteUrl: en esta fuente cada trámite se identifica por la URL de su ficha'), { identificable: false });
    }

    const sectorId = sectorDelTramite(t, datos.sectores, ids);
    if (!sectorId) {
      return marcar(porUrl.get(fuenteUrl)?.id ?? null, () => fallido(`sector no encontrado o ambiguo: "${t.sector}"`), { identificable: Boolean(porUrl.get(fuenteUrl)) });
    }
    if (!textoValido(t.nombre) || !textoValido(t.descripcion)) {
      return marcar(porUrl.get(fuenteUrl)?.id ?? null, () => fallido('falta el nombre o la descripción'), { identificable: Boolean(porUrl.get(fuenteUrl)) });
    }

    // El nombre del sector también le llega al modelo ("Organismo"), así que se revisa con el trámite,
    // igual que todo lo que viene de la ficha.
    const sospechas = instruccionesEn({ nombre: t.nombre, descripcion: t.descripcion, sector: t.sector, ...textosDeFicha(t.ficha) });

    // Sigue en el XML pero el sitio ya no lo lista: con --completa se despublica hasta revisión. Los
    // de un organismo que el sitio no indexa quedan como están.
    const fuera = t.enListado === false;
    const despublicarPorListado = fuera && completa && t.organismoIndexado !== false;
    const informarFuera = (id, accion) => {
      if (fuera) informe.fueraDelListado.push({ id, nombre: t.nombre, sector: t.sector, motivo: motivoFueraDelListado(t), accion, despublica: /^(?:despublicado|se despublicaría) hasta revisión$/.test(accion) });
    };
    const accionFuera = (publicado) => {
      if (t.organismoIndexado === false) return 'queda como está (el sitio no indexa su organismo)';
      if (!completa) return 'se despublica con --completa';
      if (!publicado) return 'ya estaba sin publicar';
      return simular ? 'se despublicaría hasta revisión' : 'despublicado hasta revisión';
    };
    const revisar = (id, accion) => {
      if (sospechas.length > 0) informe.paraRevisar.push({ id, nombre: t.nombre, fuenteUrl, frases: sospechas, accion });
    };

    const clave = claveDe(sectorId, t.nombre);
    const delSectorSinUrl = (porClave.get(clave) ?? []).filter((c) => !c.fuenteUrl);
    let existente = null;

    if (fuenteUrl) {
      existente = porUrl.get(fuenteUrl) ?? null;
      // Un trámite cargado a mano (sin huella y con otro encargado) no se toca aunque tenga la URL.
      if (existente && !delImportador(existente)) {
        informarFuera(existente.id, 'manual, no se toca');
        return marcar(existente.id, () => informe.manuales.push({ id: existente.id, nombre: existente.nombre, fuenteUrl, motivo: 'manual, no se toca' }));
      }
      if (existente && existente.sectorId !== sectorId) {
        return marcar(existente.id, () => conflicto(`la fuenteUrl ya es del trámite ${existente.id} ("${existente.nombre}") de otro sector`, existente.id));
      }
      // Un trámite que el importador creó sin URL la adopta si ahora viene con una.
      if (!existente && !soloPorUrl) {
        const adoptable = delSectorSinUrl.filter(delImportador);
        if (adoptable.length === 1) existente = adoptable[0];
      }
    } else {
      if (clavesDelJson.has(clave)) return marcar(null, () => conflicto('repetido en el JSON (mismo sector y nombre, sin fuenteUrl)'));
      clavesDelJson.add(clave);
      const delSistema = delSectorSinUrl.filter(delImportador);
      if (delSistema.length > 1) {
        delSistema.forEach((c) => vistos.add(c.id));
        return marcar(null, () => conflicto(`hay ${delSistema.length} trámites del importador sin fuenteUrl con ese nombre en el sector`));
      }
      if (delSistema.length === 0 && delSectorSinUrl.length > 0) {
        return marcar(delSectorSinUrl[0].id, () => conflicto('ya hay un trámite cargado a mano con ese nombre en el sector: no se pisa', delSectorSinUrl[0].id));
      }
      existente = delSistema[0] ?? null;
    }

    const f = t.ficha;
    if (f?.enlacesRotos.length > 0) informe.enlacesRotos.push(...f.enlacesRotos.map((e) => ({ ...e, tramite: t.nombre })));
    const mesaIds = f ? await resolverMesas(f.mesas, sectorId) : null;
    const nuevos = f ? valoresDeFicha(f, mesaIds) : null;

    if (existente) {
      marcar(existente.id);
      const data = {};
      const listas = {};
      const gruposCambiados = [];
      const conservados = [];
      const huella = { ...(existente.huellaImportacion ?? {}) };
      const cambiar = (grupo) => gruposCambiados.push(grupo);

      if (existente.nombre !== t.nombre.trim()) {
        data.nombre = t.nombre.trim();
        cambiar('nombre');
      }
      if (fuenteUrl && existente.fuenteUrl !== fuenteUrl) {
        data.fuenteUrl = fuenteUrl;
        cambiar('fuenteUrl');
      }

      // Cada grupo se escribe solo si nadie lo editó a mano desde la última importación.
      const grupos = ['descripcion', ...(nuevos ? GRUPOS_FICHA : [])];
      const valores = { ...nuevos, descripcion: t.descripcion };
      for (const grupo of grupos) {
        const nuevaHuella = huellaDeGrupo(grupo, valores);
        const igual = nuevaHuella === huellaDeGrupo(grupo, existente);
        if (!puedeEscribir(grupo, existente)) {
          // Igual a lo del portal: desde ahora es del importador. Distinto: lo editó alguien.
          if (igual) huella[grupo] = nuevaHuella;
          else conservados.push(grupo);
          continue;
        }
        huella[grupo] = nuevaHuella;
        if (igual) continue;
        cambiar(grupo);
        if (grupo === 'descripcion') data.descripcion = t.descripcion;
        if (grupo === 'costo') Object.assign(data, { costo: nuevos.costo, costoDetalle: nuevos.costoDetalle });
        if (grupo === 'informacionAdicional') data.informacionAdicional = nuevos.informacionAdicional;
        if (grupo === 'requisitos') listas.requisitos = nuevos.requisitos;
        if (grupo === 'mesas') listas.mesaIds = nuevos.mesaIds;
        if (grupo === 'documentos') listas.documentos = nuevos.documentos;
      }
      if (conservados.length > 0) informe.conservados.push({ id: existente.id, nombre: t.nombre, grupos: conservados });

      // La fecha de la captura y la huella se guardan aunque no haya otro cambio, sin contarlo.
      const extra = {};
      if (f?.verificadoEn && existente.verificadoEn?.getTime() !== f.verificadoEn.getTime()) extra.verificadoEn = f.verificadoEn;
      if (JSON.stringify(huella) !== JSON.stringify(existente.huellaImportacion ?? {})) extra.huellaImportacion = huella;
      informarFuera(existente.id, accionFuera(existente.publicado));
      if (despublicarPorListado && existente.publicado) extra.publicado = false;

      if (gruposCambiados.length === 0) {
        informe.sinCambios++;
        if (!simular && Object.keys(extra).length > 0) await prisma.tramite.update({ where: { id: existente.id }, data: extra });
        revisar(existente.id, existente.publicado ? 'sin cambios, sigue publicado' : 'sin cambios, sin publicar');
        if (sinEmbedding.has(existente.id)) aIndexar.add(existente.id);
        return;
      }
      if (sospechas.length > 0) data.publicado = false;
      const delEmbedding = gruposCambiados.some((g) => g === 'nombre' || DEL_EMBEDDING.has(g));
      if (!simular) await escribirTramite(existente.id, { ...data, ...extra }, listas, { invalidarEmbedding: delEmbedding });
      informe.actualizados.push({ id: existente.id, nombre: t.nombre, grupos: gruposCambiados });
      revisar(existente.id, 'actualizado sin publicar');
      if (delEmbedding || sinEmbedding.has(existente.id)) aIndexar.add(existente.id);
      return;
    }

    marcar(null);
    const accionNuevo = despublicarPorListado ? 'creado sin publicar hasta revisión' : accionFuera(false);
    if (simular) {
      informarFuera(null, accionNuevo);
      informe.creados.push({ id: null, nombre: t.nombre });
      revisar(null, 'creado sin publicar');
      return;
    }
    const huella = { descripcion: huellaDeGrupo('descripcion', t) };
    if (nuevos) for (const grupo of GRUPOS_FICHA) huella[grupo] = huellaDeGrupo(grupo, nuevos);
    const creado = await prisma.$transaction(async (tx) => {
      const tramite = await tx.tramite.create({
        data: {
          nombre: t.nombre.trim(), descripcion: t.descripcion, sectorId, encargadoId: sistema.id, publicado: publicar && sospechas.length === 0 && !despublicarPorListado, fuenteUrl,
          huellaImportacion: huella,
          ...(nuevos && {
            costo: nuevos.costo, costoDetalle: nuevos.costoDetalle, informacionAdicional: nuevos.informacionAdicional, verificadoEn: f.verificadoEn,
            requisitos: { create: nuevos.requisitos },
            documentos: { create: nuevos.documentos },
          }),
        },
      });
      if (nuevos?.mesaIds.length > 0) await tx.tramiteMesa.createMany({ data: nuevos.mesaIds.map((mesaId) => ({ tramiteId: tramite.id, mesaId })), skipDuplicates: true });
      return tramite;
    });
    informarFuera(creado.id, accionNuevo);
    informe.creados.push({ id: creado.id, nombre: t.nombre });
    revisar(creado.id, 'creado sin publicar');
    aIndexar.add(creado.id);
  };

  // Un trámite del JSON que no se puede identificar podría ser uno de los "faltantes": si hay
  // alguno, no se despublica nada.
  for (const t of datos.tramites) {
    let marcado = false;
    const marcar = (id, registrar, { identificable = true } = {}) => {
      if (id !== null) vistos.add(id);
      if (!identificable) noIdentificados++;
      marcado = true;
      registrar?.();
    };
    try {
      await procesar(t, marcar);
    } catch (err) {
      if (!marcado) noIdentificados++;
      informe.fallidos.push({ nombre: t?.nombre ?? null, fuenteUrl: t?.fuenteUrl ?? null, motivo: err.message.split('\n').at(-1).trim() });
    }
  }

  if (despublicarFaltantes) {
    if (noIdentificados > 0) {
      informe.despublicacion = `omitida: ${noIdentificados} trámites del JSON no se pudieron identificar y podrían estar entre los faltantes`;
      log.warn(`No se despublica nada: ${informe.despublicacion}`);
    } else {
      // "Completa" vale para los organismos del JSON: un catálogo municipal no despublica el provincial.
      const todos = await leerSectoresParaResolver();
      const alcance = new Set([...ids.values()].filter(esIdReal).flatMap((id) => [...subarbol(todos, id)]));
      const deLaFuente = (t) => !fuenteDeFaltantes || (t.fuenteUrl ?? '').startsWith(fuenteDeFaltantes);
      const faltantes = existentes.filter((t) => delImportador(t) && t.publicado && alcance.has(t.sectorId) && !vistos.has(t.id) && deLaFuente(t));
      if (!simular && faltantes.length > 0) {
        await prisma.tramite.updateMany({
          where: {
            id: { in: faltantes.map((t) => t.id) }, encargadoId: sistema.id, publicado: true,
            ...(fuenteDeFaltantes && { fuenteUrl: { startsWith: fuenteDeFaltantes } }),
          },
          data: { publicado: false },
        });
      }
      informe.despublicados = faltantes.map((t) => ({ id: t.id, nombre: t.nombre }));
      informe.despublicacion = simular ? 'simulada' : 'hecha';
    }
  }

  const pendientes = [...aIndexar].filter((id) => esIdReal(id));
  if (simular) {
    informe.reindexados = pendientes;
  } else if (pendientes.length > 0) {
    log.log(`Generando embeddings de ${pendientes.length} trámites en lotes de ${lote}...`);
    const r = await reindexar(pendientes, { lote, log });
    informe.reindexados = r.reindexados;
    informe.fallidos.push(...r.fallidos);
  }

  const huboCambios = sectores.creados + sectores.actualizados + informe.creados.length + informe.actualizados.length
    + informe.reindexados.length + informe.despublicados.length + informe.mesas.creadas + informe.mesas.actualizadas
    + informe.fueraDelListado.filter((f) => f.despublica).length > 0;
  let cache = { invalidada: false, version: null, error: null };
  if (!simular && huboCambios) {
    try {
      cache = { invalidada: true, version: await marcarCatalogoCambiado(), error: null };
    } catch (err) {
      cache = { invalidada: false, version: null, error: err.message.split('\n').at(-1).trim() };
    }
  }

  const sectorIds = datos.sectores.map((s, i) => ({ nombre: s.nombre, padre: s.padre ?? null, id: ids.get(i) ?? null }));
  return { simulado: simular, sectores, sectorIds, ...informe, cache };
};

// --- Fuente municipal (ingestion: python main.py --municipal) -----------------------------------

export const FUENTE_MUNICIPAL = 'municipalidad-formosa';
export const BASE_MUNICIPAL = 'https://formosatuciudad.gob.ar/';

// Valida el JSON del scraper municipal y arma las opciones de la importación. Despublicar faltantes
// solo es seguro con el listado entero leído: sin fichas no reconocidas ni con error, ni una muestra.
export const opcionesMunicipales = (datos, { despublicar = true } = {}) => {
  if (datos?.fuente !== FUENTE_MUNICIPAL) throw new Error(`El JSON no es de la fuente municipal (fuente: ${datos?.fuente ?? 'sin fuente'}).`);
  const sectores = datos.sectores ?? [];
  const raices = sectores.filter((s) => !s.padre);
  if (raices.length !== 1 || raices[0].jurisdiccion !== 'MUNICIPAL' || !raices[0].localidad) {
    throw new Error('El catálogo municipal tiene que tener un único sector raíz, municipal y con localidad.');
  }
  const porNombre = new Map(sectores.map((s) => [s.nombre, s]));
  for (const s of sectores) {
    let actual = s;
    for (let pasos = 0; actual?.padre && pasos < sectores.length; pasos++) actual = porNombre.get(actual.padre);
    if (actual !== raices[0]) throw new Error(`El sector "${s.nombre}" no depende de "${raices[0].nombre}".`);
  }
  const ajenos = (datos.tramites ?? []).filter((t) => typeof t?.fuenteUrl !== 'string' || !t.fuenteUrl.startsWith(BASE_MUNICIPAL));
  if (ajenos.length > 0) throw new Error(`${ajenos.length} trámites del JSON no tienen una fuenteUrl de ${BASE_MUNICIPAL}.`);

  const noReconocidas = datos.noReconocidas ?? [];
  const errores = datos.errores ?? [];
  const bloqueos = [
    datos.parcial && 'el JSON es una muestra del listado',
    noReconocidas.length > 0 && `${noReconocidas.length} fichas no reconocidas`,
    errores.length > 0 && `${errores.length} fichas con error de descarga`,
  ].filter(Boolean);
  return {
    opciones: {
      soloPorUrl: true,
      completa: !datos.parcial,
      despublicarFaltantes: despublicar && bloqueos.length === 0,
      fuenteDeFaltantes: BASE_MUNICIPAL,
    },
    sinDespublicar: !despublicar ? 'pedido con --sin-despublicar' : bloqueos.join('; ') || null,
    noReconocidas,
    errores,
  };
};

const lista = (titulo, items, formato) =>
  items.length === 0 ? [] : [`${titulo}:`, ...items.map((x) => `  - ${formato(x)}`)];

export const formatearInforme = (r) => [
  r.simulado ? 'SIMULACIÓN (--dry-run): no se escribió nada.' : 'Importación terminada.',
  `Sectores: ${r.sectores.creados} ${r.simulado ? 'a crear' : 'creados'}, ${r.sectores.actualizados} ${r.simulado ? 'a actualizar' : 'actualizados'}`,
  `Trámites: ${r.creados.length} creados, ${r.actualizados.length} actualizados, ${r.sinCambios} sin cambios, ${r.fueraDelListado.filter((f) => f.despublica).length} ${r.simulado ? 'a despublicar' : 'despublicados'} por no figurar en el listado, ${r.reindexados.length} ${r.simulado ? 'a reindexar' : 'reindexados'}, ${r.fallidos.length} fallidos, ${r.conflictos.length} conflictos, ${r.paraRevisar.length} para revisión`,
  `Mesas de entrada del portal: ${r.mesas.creadas} ${r.simulado ? 'a crear' : 'creadas'}, ${r.mesas.actualizadas} ${r.simulado ? 'a actualizar' : 'actualizadas'}, ${r.mesas.conservadas.length} editadas a mano (no se tocan)`,
  ...(r.despublicacion ? [`Despublicación de faltantes: ${r.despublicacion}${r.despublicacion.startsWith('omitida') ? '' : ` (${r.despublicados.length})`}`] : []),
  ...lista('Fallidos', r.fallidos, (f) => `${f.nombre ?? `id ${f.id}`}${f.fuenteUrl ? ` <${f.fuenteUrl}>` : ''}: ${f.motivo}`),
  ...lista('Conflictos', r.conflictos, (c) => `${c.nombre}${c.fuenteUrl ? ` <${c.fuenteUrl}>` : ''}: ${c.motivo}`),
  ...lista('Para revisión (frases con forma de instrucción para el asistente)', r.paraRevisar, (p) =>
    `${p.id ?? 'nuevo'} ${p.nombre}${p.fuenteUrl ? ` <${p.fuenteUrl}>` : ''}: ${p.frases.map((f) => `"${f.frase}" (${f.campo})`).join(', ')}; ${p.accion}`),
  ...lista('Recortados', r.recortados, (x) => `${x.nombre}: ${x.campo} a ${x.tope} caracteres`),
  ...lista('Manuales (no se tocan)', r.manuales, (m) => `${m.id} ${m.nombre}${m.fuenteUrl ? ` <${m.fuenteUrl}>` : ''}: ${m.motivo}`),
  ...lista('Conservados (editados a mano, no se pisan)', r.conservados, (c) => `${c.id} ${c.nombre}: ${c.grupos.join(', ')}`),
  ...lista('Mesas editadas a mano (no se pisan)', r.mesas.conservadas, (m) => `${m.id} ${m.nombre}`),
  ...lista('Enlaces rotos (no se importan)', r.enlacesRotos, (e) => `${e.tramite}: ${e.tipo} "${e.nombre}" <${e.url}>`),
  ...lista(`Fuera del listado del sitio (${r.fueraDelListado.length})`, r.fueraDelListado, (f) => `${f.id ?? 'nuevo'} ${f.nombre} [${f.sector}]: ${f.motivo}; ${f.accion}`),
  ...lista(r.simulado ? 'Se despublicarían' : 'Despublicados', r.despublicados, (d) => `${d.id} ${d.nombre}`),
].join('\n');
