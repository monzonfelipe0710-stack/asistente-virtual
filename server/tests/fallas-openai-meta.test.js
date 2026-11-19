import './helpers/base-de-prueba.js';
// Las fallas de OpenAI con STREAM_ESQUEMA=false: el streaming con la línea META, sin el esquema JSON.
process.env.STREAM_ESQUEMA = 'false';
await import('./fallas-openai.test.js');
