// Los tests del chat con STREAM_INCREMENTAL=false: el comportamiento de antes del modo incremental.
process.env.STREAM_INCREMENTAL = 'false';
await import('./chat.test.js');
