import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { esOtroIdioma, pareceEspanol } from '../src/utils/idioma.js';

describe('idioma de la respuesta', () => {
  it('reconoce una respuesta en inglés o en portugués', () => {
    for (const texto of [
      "I'm here to assist with information about procedures in the province of Formosa and its municipalities. If you have any questions about a specific procedure, feel free to ask!",
      "I'm sorry, but I can only assist with information about procedures and paperwork. If you have any questions about a specific procedure, feel free to ask!",
      'Olá! Eu posso ajudar você com informações sobre os trâmites da província. Qual trâmite você precisa? Não tenho mais dados.',
    ]) {
      assert.ok(esOtroIdioma(texto), texto);
    }
  });

  it('no toca una respuesta en español con términos o nombres en inglés', () => {
    for (const texto of [
      'Para el trámite de la Licencia de Pesca Deportiva necesitás el DNI. El costo no está cargado.',
      'La sala tiene Wi-Fi y podés hacer el trámite online con tu e-mail. Es gratuito.',
      'El programa Work and Travel no está en el catálogo. ¿Te ayudo con otro trámite?',
      'Hay que presentar el formulario "Free Shop" en la mesa de entradas del organismo.',
      'Por ahora solo atiendo en español. ¿Te ayudo con algún trámite?',
      'Hola',
    ]) {
      assert.ok(!esOtroIdioma(texto), texto);
    }
  });

  it('un texto corto se ve en español con dos palabras propias y ninguna de otro idioma', () => {
    assert.ok(pareceEspanol('Se pide turno en la mesa de entrada.'));
    assert.ok(!pareceEspanol('Hello!'));
    assert.ok(!pareceEspanol('Sure, here is the list:'));
  });
});
