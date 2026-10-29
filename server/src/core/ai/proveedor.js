/**
 * Puerto de IA: contrato que cumple cualquier proveedor (OpenAI, u otro a futuro).
 * El resto del backend depende de esta interfaz, nunca de un SDK concreto.
 *
 * @typedef {{ rol: 'usuario' | 'asistente', texto: string }} Turno
 *
 * @typedef {Object} ProveedorIA
 * @property {(texto: string) => Promise<number[]>} generarEmbedding
 * @property {(args: { instruccionSistema: string, turnos: Turno[], esquema?: object }) => Promise<string>} generarRespuesta
 * @property {(args: { instruccionSistema: string, turnos: Turno[] }) => AsyncGenerator<string>} generarRespuestaStream
 * @property {{ modelo: string, dimensiones: number }} infoEmbedding
 */
export {};
