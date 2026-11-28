import { TIEMPOS_IA } from '../../config/ia.js';
import { combinarSenales } from '../../utils/plazo.js';
import { ErrorProveedorIA } from './errores.js';

// Red de seguridad, no un recorte: la respuesta más larga medida queda muy por debajo. Una salida
// cortada por el tope es una falla: no se cachea ni se registra.
export const MAX_TOKENS_RESPUESTA = 1500;

export const maxTokensDe = (modelo) => modelo.parametros?.maxTokens ?? MAX_TOKENS_RESPUESTA;

export const maxTokensDeTipeo = (modelo, texto) => Math.min(maxTokensDe(modelo), Math.ceil(texto.length / 2) + 20);

// Las variables OPENAI_TIMEOUT_CHAT_MS y OPENAI_REINTENTOS_CHAT, si están, pisan las del modelo. Con un
// modelo de respaldo el activo no reintenta: el reintento es el modelo por defecto.
export const tiemposDe = (modelo, { sinReintentos } = {}) => ({
  timeout: TIEMPOS_IA.chatDelEntorno.timeout ?? modelo.parametros?.timeoutMs ?? TIEMPOS_IA.chat.timeout,
  maxRetries: sinReintentos ? 0 : TIEMPOS_IA.chatDelEntorno.maxRetries ?? modelo.parametros?.reintentos ?? TIEMPOS_IA.chat.maxRetries,
});

// Un stream que deja de mandar pedazos se corta (el timeout de los SDK cubre solo hasta las cabeceras).
export const crearInactividad = (signal, operacion) => {
  const inactividad = new AbortController();
  const senal = combinarSenales(signal, inactividad.signal);
  let temporizador;
  return {
    senal,
    rearmar() {
      clearTimeout(temporizador);
      temporizador = setTimeout(
        () => inactividad.abort(new ErrorProveedorIA('stream inactivo', { operacion, tipo: 'timeout' })),
        TIEMPOS_IA.inactividadStream,
      );
    },
    limpiar: () => clearTimeout(temporizador),
  };
};

export const incompleta = (motivo, operacion, tipo = 'contenido') =>
  new ErrorProveedorIA(`respuesta incompleta (fin: ${motivo ?? 'ninguno'})`, { operacion, tipo });

export const negativa = (operacion) => new ErrorProveedorIA('el modelo se negó a responder (refusal)', { operacion, tipo: 'contenido' });
