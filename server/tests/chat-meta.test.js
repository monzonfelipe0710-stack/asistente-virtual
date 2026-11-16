import './helpers/base-de-prueba.js';
// Los tests del chat con STREAM_ESQUEMA=false: el streaming con la línea META, sin el esquema JSON.
process.env.STREAM_ESQUEMA = 'false';
await import('./chat.test.js');
