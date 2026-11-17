import { appendFileSync } from 'node:fs';
import { embeddingsOpenai, chatOpenai } from './openai.adapter.js';
import { ErrorProveedorIA, TIPOS_CON_RESPALDO } from './errores.js';
import { enteroDeEntorno } from '../../config/ia.js';
import { msRestantes } from '../../utils/plazo.js';
import { resolverModeloChat } from '../../services/modelo-chat.service.js';

export const MARGEN_RESPALDO_MS = enteroDeEntorno('CHAT_RESPALDO_MARGEN_MS', 4000, 0);

const ADAPTADORES = {
  openai: async () => chatOpenai,
};

const adaptadorDe = async (modelo) => {
  const cargar = ADAPTADORES[modelo.proveedor];
  if (!cargar) throw new ErrorProveedorIA(`proveedor sin adaptador (${modelo.proveedor})`, { operacion: 'chat', tipo: 'configuracion' });
  try {
    return await cargar();
  } catch (err) {
    throw new ErrorProveedorIA(`no se pudo cargar el adaptador de ${modelo.proveedor}`, { operacion: 'chat', tipo: 'configuracion', original: err });
  }
};

// Solo para los scripts de evaluación: una línea JSON por llamada con los tokens usados.
const registrarUso = (uso) => {
  const archivo = process.env.NODE_ENV === 'production' ? null : process.env.IA_REGISTRO_USO?.trim();
  if (archivo && uso) appendFileSync(archivo, `${JSON.stringify(uso)}\n`);
};

const respaldoPara = (modelo, err, signal, operacion) => {
  const respaldo = modelo.respaldo;
  if (!respaldo || !(err instanceof ErrorProveedorIA) || !TIPOS_CON_RESPALDO.has(err.tipo) || signal?.aborted) return null;
  const restante = msRestantes(signal);
  if (restante !== null && restante < MARGEN_RESPALDO_MS) {
    console.warn(`Chat: el modelo ${modelo.id} falló (${operacion}: ${err.causa}) y no queda plazo para el de respaldo (${restante} ms)`);
    return null;
  }
  console.warn(`Chat: el modelo ${modelo.id} falló (${operacion}: ${err.causa}); responde el modelo por defecto ${respaldo.id}`);
  return respaldo;
};

const pedidoPara = (modelo, pedido) => ({ ...pedido, sinReintentos: Boolean(modelo.respaldo), alUsar: registrarUso });

/** @type {import('./proveedor.js').ProveedorIA} */
export const ia = {
  generarEmbedding: (texto, opciones = {}) => embeddingsOpenai.generarEmbedding(texto, { ...opciones, alUsar: registrarUso }),
  generarEmbeddings: (textos, opciones) => embeddingsOpenai.generarEmbeddings(textos, opciones),
  infoEmbedding: embeddingsOpenai.infoEmbedding,

  async generarRespuesta(pedido) {
    const modelo = pedido.modelo ?? (await resolverModeloChat());
    try {
      return await (await adaptadorDe(modelo)).generarRespuesta(modelo, pedidoPara(modelo, pedido));
    } catch (err) {
      const respaldo = respaldoPara(modelo, err, pedido.signal, 'chat');
      if (!respaldo) throw err;
      const salida = await (await adaptadorDe(respaldo)).generarRespuesta(respaldo, pedidoPara(respaldo, pedido));
      pedido.alResponder?.(respaldo);
      return salida;
    }
  },

  // Si el modelo ya mandó texto, el respaldo no puede continuar: la falla sale como siempre.
  async *generarRespuestaStream(pedido) {
    const modelo = pedido.modelo ?? (await resolverModeloChat());
    let emitio = false;
    try {
      for await (const delta of (await adaptadorDe(modelo)).generarRespuestaStream(modelo, pedidoPara(modelo, pedido))) {
        emitio = true;
        yield delta;
      }
      return;
    } catch (err) {
      const respaldo = emitio ? null : respaldoPara(modelo, err, pedido.signal, 'chat_stream');
      if (!respaldo) throw err;
      pedido.alResponder?.(respaldo);
      yield* (await adaptadorDe(respaldo)).generarRespuestaStream(respaldo, pedidoPara(respaldo, pedido));
    }
  },

  // La corrección de tipeo no usa respaldo: si falla, la consulta sigue con la búsqueda original.
  async corregirTexto(pedido) {
    const modelo = pedido.modelo ?? (await resolverModeloChat());
    return (await adaptadorDe(modelo)).corregirTexto(modelo, { ...pedido, alUsar: registrarUso });
  },
};
