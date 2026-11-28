/**
 * Dos puertos de IA. Los embeddings son siempre de OpenAI (cambiarlos invalida los vectores); el chat
 * es del modelo elegido (config/modelos-chat.json y la tabla modelo_chat), con un adaptador por
 * proveedor. `ia` (core/ai/index.js) junta los dos para el resto del backend.
 * `signal` corta la llamada (plazo del chat o desconexión del cliente).
 *
 * @typedef {{ rol: 'usuario' | 'asistente', texto: string }} Turno
 * @typedef {{ id: string, proveedor: string, modeloApi: string, parametros: object, precios: object, respaldo?: ModeloChat | null }} ModeloChat
 * @typedef {{ instruccionSistema: string, turnos: Turno[], esquema?: object, signal?: AbortSignal, sinReintentos?: boolean, alUsar?: (uso: object) => void }} PedidoChat
 *
 * @typedef {Object} AdaptadorChat
 * @property {(modelo: ModeloChat, pedido: PedidoChat) => Promise<string>} generarRespuesta
 * @property {(modelo: ModeloChat, pedido: PedidoChat) => AsyncGenerator<string>} generarRespuestaStream
 * @property {(modelo: ModeloChat, pedido: { instruccionSistema: string, texto: string, signal?: AbortSignal, timeout: number, alUsar?: Function }) => Promise<string>} corregirTexto
 *
 * @typedef {Object} ProveedorIA
 * @property {(texto: string, opciones?: { signal?: AbortSignal }) => Promise<number[]>} generarEmbedding
 * @property {(textos: string[], opciones?: { signal?: AbortSignal, timeout?: number }) => Promise<{ vectores: number[][], tokens: number | null }>} generarEmbeddings
 * @property {(pedido: PedidoChat & { modelo?: ModeloChat, alResponder?: (modelo: ModeloChat) => void }) => Promise<string>} generarRespuesta
 * @property {(pedido: PedidoChat & { modelo?: ModeloChat, alResponder?: (modelo: ModeloChat) => void }) => AsyncGenerator<string>} generarRespuestaStream
 * @property {(pedido: { instruccionSistema: string, texto: string, signal?: AbortSignal, timeout: number, modelo?: ModeloChat }) => Promise<string>} corregirTexto
 * @property {{ modelo: string, dimensiones: number }} infoEmbedding
 */
export {};
