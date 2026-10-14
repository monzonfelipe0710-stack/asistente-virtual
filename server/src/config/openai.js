import OpenAi from 'openai';

// El server debe poder arrancar sin OPENAI_API_KEY (chat y embeddings quedan
// sin funcionar hasta que se configure). Cuando la clave está presente, el
// comportamiento es el de siempre.
export const openai = new OpenAi({
  apiKey: process.env.OPENAI_API_KEY || 'sin-configurar',
});