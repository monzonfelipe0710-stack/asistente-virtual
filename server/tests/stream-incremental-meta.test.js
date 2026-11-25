import './helpers/base-de-prueba.js';
// El streaming incremental con STREAM_ESQUEMA=false: la salida del modelo con la línea META.
process.env.STREAM_ESQUEMA = 'false';
await import('./stream-incremental.test.js');
