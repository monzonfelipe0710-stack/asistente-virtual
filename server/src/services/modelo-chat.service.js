import prisma from '../config/prisma.js';
import { enteroDeEntorno } from '../config/ia.js';
import {
  avisarUnaVez,
  costoPor1000,
  idForzado,
  idPorDefectoDelEntorno,
  modeloDelCatalogo,
  proveedorConocido,
  tieneClave,
} from '../config/modelos-chat.js';

const VIGENCIA_MS = enteroDeEntorno('MODELO_CHAT_CACHE_MS', 30000, 0);

const desdeFila = (f) => ({
  id: f.id,
  proveedor: f.proveedor,
  modeloApi: f.modeloApi,
  nombre: f.nombreVisible,
  parametros: f.parametros ?? {},
  precios: f.precios ?? {},
  habilitado: f.habilitado,
  estadoEval: f.estadoEval ?? null,
  esPorDefecto: f.esPorDefecto,
});

const desdeCatalogo = (m) =>
  m && {
    id: m.id,
    proveedor: m.proveedor,
    modeloApi: m.modeloApi,
    nombre: m.nombre,
    parametros: m.parametros,
    precios: m.precios,
    habilitado: m.habilitado,
    estadoEval: null,
    esPorDefecto: m.id === idPorDefectoDelEntorno(),
  };

const codigoDe = (err) => err?.code ?? err?.errorCode ?? err?.name ?? 'error';

const leerEstado = async () => {
  const [filas, config] = await Promise.all([
    prisma.modeloChat.findMany({ orderBy: { id: 'asc' } }),
    prisma.configuracionChat.findUnique({ where: { id: 1 } }),
  ]);
  return {
    modelos: new Map(filas.map((f) => [f.id, desdeFila(f)])),
    activoId: config?.modeloActivoId ?? null,
    porDefectoId: filas.find((f) => f.esPorDefecto)?.id ?? null,
    actualizadoPor: config?.actualizadoPor ?? null,
    actualizadoEn: config?.actualizadoEn ?? null,
  };
};

let estado = null;
let lectura = null;
let ultimoError = null;

const obtenerEstado = () => {
  if (estado && Date.now() < estado.expira) return estado;
  lectura ??= (async () => {
    try {
      estado = { ...(await leerEstado()), expira: Date.now() + VIGENCIA_MS };
      ultimoError = null;
    } catch (err) {
      const codigo = codigoDe(err);
      if (codigo !== ultimoError) console.warn(`Chat: no se pudo leer la configuración del modelo (${codigo}): se usa el modelo por defecto del entorno (${idPorDefectoDelEntorno()}).`);
      ultimoError = codigo;
      estado = { error: codigo, expira: Date.now() + VIGENCIA_MS };
    } finally {
      lectura = null;
    }
    return estado;
  })();
  return lectura;
};

export const invalidarModeloChat = () => {
  estado = null;
};

const motivoNoUsable = (m) => {
  if (!m) return 'no existe';
  if (!proveedorConocido(m.proveedor)) return `proveedor desconocido (${m.proveedor})`;
  if (!tieneClave(m.proveedor)) return 'falta la clave del proveedor';
  return null;
};

const resuelto = (m, origen, respaldo = null) => ({ ...m, origen, respaldo });

// El modelo de una consulta. Nunca falla: si la configuración no se puede leer o el modelo activo
// no se puede usar, responde el modelo por defecto. `respaldo` es el modelo por defecto cuando el
// activo es otro (ver core/ai/index.js); con MODELO_CHAT_FORZADO no hay respaldo.
export const resolverModeloChat = async () => {
  const st = await obtenerEstado();
  const forzado = idForzado();
  if (forzado) {
    const m = st.modelos?.get(forzado) ?? desdeCatalogo(modeloDelCatalogo(forzado));
    const motivo = motivoNoUsable(m);
    if (!motivo) return resuelto(m, 'forzado');
    avisarUnaVez(`forzado:${forzado}:${motivo}`, `MODELO_CHAT_FORZADO=${forzado} no se puede usar (${motivo}): se ignora.`);
  }

  const delEntorno = desdeCatalogo(modeloDelCatalogo(idPorDefectoDelEntorno()));
  if (st.error) return resuelto(delEntorno, 'entorno');

  const guardado = st.modelos.get(st.porDefectoId);
  const porDefecto = guardado && !motivoNoUsable(guardado) ? resuelto(guardado, 'base') : resuelto(delEntorno, 'entorno');
  const activo = st.modelos.get(st.activoId);
  const motivo = motivoNoUsable(activo) ?? (activo.habilitado ? null : 'está deshabilitado');
  if (motivo) {
    avisarUnaVez(`activo:${st.activoId}:${motivo}`, `Chat: el modelo activo ${st.activoId ?? '(ninguno)'} no se puede usar (${motivo}): responde ${porDefecto.id}.`);
    return porDefecto;
  }
  if (activo.id === porDefecto.id) return resuelto(activo, 'base');
  return resuelto(activo, 'base', { ...porDefecto, origen: 'respaldo', respaldo: null });
};

// --- Administración -----------------------------------------------------------------------------

const errorConEstado = (mensaje, statusCode) => Object.assign(new Error(mensaje), { statusCode });

const sinConfiguracion = (err) => {
  if (['P2021', 'P2022'].includes(err?.code)) {
    return errorConEstado('La configuración de modelos del chat no está disponible: falta aplicar la migración.', 503);
  }
  return err;
};

const motivoNoSeleccionable = (m, activoId) => {
  if (!proveedorConocido(m.proveedor)) return 'El proveedor no está soportado.';
  if (!m.habilitado) {
    if (m.estadoEval?.criterio?.cumple) return 'Deshabilitado: la evaluación cumple el criterio, falta habilitarlo.';
    if (m.estadoEval) return 'Deshabilitado: la evaluación no cumple el criterio.';
    return modeloDelCatalogo(m.id)?.sondeado ? 'Deshabilitado: falta la evaluación.' : 'Deshabilitado: sin sondear ni evaluar.';
  }
  if (!tieneClave(m.proveedor)) return 'Falta la clave de API del proveedor en el servidor.';
  if (m.id === activoId) return 'Ya es el modelo activo.';
  return null;
};

const avisosDe = (m) => {
  const avisos = [];
  const catalogo = modeloDelCatalogo(m.id);
  if (catalogo && !catalogo.sondeado) avisos.push('sin sondear');
  if (!m.estadoEval) avisos.push('sin evaluar');
  return avisos;
};

const resumenDeEval = (e) =>
  e && {
    fecha: e.fecha ?? null,
    cumple: e.criterio?.cumple ?? null,
    motivos: e.criterio?.motivos ?? [],
    resumen: e.resumen ?? null,
  };

export const listarModelos = async () => {
  let st;
  try {
    st = await leerEstado();
  } catch (err) {
    throw sinConfiguracion(err);
  }
  invalidarModeloChat();
  const enUso = await resolverModeloChat();
  const usuario = st.actualizadoPor
    ? await prisma.usuario.findUnique({ where: { id: st.actualizadoPor }, select: { id: true, nombre: true } })
    : null;
  return {
    activo: st.activoId,
    enUso: enUso.id,
    origen: enUso.origen,
    actualizadoPor: usuario,
    actualizadoEn: st.actualizadoEn,
    modelos: [...st.modelos.values()].map((m) => {
      const motivo = motivoNoSeleccionable(m, st.activoId);
      return {
        id: m.id,
        proveedor: m.proveedor,
        nombre: m.nombre,
        modeloApi: m.modeloApi,
        habilitado: m.habilitado,
        esPorDefecto: m.esPorDefecto,
        activo: m.id === st.activoId,
        claveConfigurada: tieneClave(m.proveedor),
        seleccionable: motivo === null,
        motivoNoSeleccionable: motivo,
        avisos: avisosDe(m),
        precios: m.precios,
        costoPor1000: { estimado: costoPor1000(m.precios), medido: m.estadoEval?.costoPor1000 ?? null },
        eval: resumenDeEval(m.estadoEval),
      };
    }),
  };
};

export const cambiarModeloActivo = async ({ modeloId, motivo, usuarioId }) => {
  try {
    const cambio = await prisma.$transaction(async (tx) => {
      const [modelo, config] = await Promise.all([
        tx.modeloChat.findUnique({ where: { id: modeloId } }),
        tx.configuracionChat.findUnique({ where: { id: 1 } }),
      ]);
      if (!modelo) throw errorConEstado('El modelo no existe.', 404);
      const noSeleccionable = motivoNoSeleccionable(desdeFila(modelo), config?.modeloActivoId);
      if (noSeleccionable) throw errorConEstado(noSeleccionable, 409);
      const anterior = config?.modeloActivoId ?? null;
      await tx.configuracionChat.upsert({
        where: { id: 1 },
        create: { id: 1, modeloActivoId: modeloId, actualizadoPor: usuarioId, actualizadoEn: new Date() },
        update: { modeloActivoId: modeloId, actualizadoPor: usuarioId, actualizadoEn: new Date() },
      });
      return tx.auditoriaModeloChat.create({
        data: { usuarioId, modeloAnteriorId: anterior, modeloNuevoId: modeloId, motivo },
      });
    });
    invalidarModeloChat();
    console.info(`Chat: el modelo activo pasó de ${cambio.modeloAnteriorId ?? '(ninguno)'} a ${cambio.modeloNuevoId} (usuario ${usuarioId}).`);
    return cambio;
  } catch (err) {
    throw sinConfiguracion(err);
  }
};

export const listarAuditoria = async ({ limite }) => {
  try {
    const filas = await prisma.auditoriaModeloChat.findMany({
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      take: limite,
      include: { usuario: { select: { id: true, nombre: true, email: true } } },
    });
    return filas.map((f) => ({
      id: f.id,
      fecha: f.fecha,
      usuario: f.usuario,
      modeloAnterior: f.modeloAnteriorId,
      modeloNuevo: f.modeloNuevoId,
      motivo: f.motivo,
    }));
  } catch (err) {
    throw sinConfiguracion(err);
  }
};
