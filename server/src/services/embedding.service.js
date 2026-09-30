import { openai } from '../config/openai.js';

const MODELO_EMBEDDING = 'text-embedding-3-small';

export const generarEmbedding = async (texto) => {
  const respuesta = await openai.embeddings.create({
    model: MODELO_EMBEDDING,
    input: texto,
  });

  return respuesta.data[0].embedding;
};