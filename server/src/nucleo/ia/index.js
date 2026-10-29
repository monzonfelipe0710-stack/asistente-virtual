import { openaiAdapter } from './openai.adapter.js';

// Proveedor activo. A futuro, elegirlo desde settings/base (fase 2: cambio de modelo desde el panel).
export const ia = openaiAdapter;
