/**
 * Puerto de IA: contrato que cumple cualquier proveedor (OpenAI, u otro a futuro).
 * El resto del backend depende de esta interfaz, nunca de un SDK concreto.
 * `signal` corta la llamada (plazo del chat o desconexión del cliente).
 *
 * @typedef {{ rol: 'usuario' | 'asistente', texto: string }} Turno
 *
 * @typedef {Object} ProveedorIA
 * @property {(texto: string, opciones?: { signal?: AbortSignal }) => Promise<number[]>} generarEmbedding
 * @property {(textos: string[], opciones?: { signal?: AbortSignal, timeout?: number }) => Promise<{ vectores: number[][], tokens: number | null }>} generarEmbeddings
 * @property {(args: { instruccionSistema: string, turnos: Turno[], esquema?: object, signal?: AbortSignal }) => Promise<string>} generarRespuesta
 * @property {(args: { instruccionSistema: string, turnos: Turno[], signal?: AbortSignal }) => AsyncGenerator<string>} generarRespuestaStream
 * @property {{ modelo: string, dimensiones: number }} infoEmbedding
 */
export {};
