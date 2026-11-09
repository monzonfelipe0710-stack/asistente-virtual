// Las fallas de OpenAI con STREAM_INCREMENTAL=false: el comportamiento de antes del modo incremental.
process.env.STREAM_INCREMENTAL = 'false';
await import('./fallas-openai.test.js');
