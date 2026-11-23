import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ESQUEMA_SALIDA, ESQUEMA_SALIDA_STREAM } from '../src/services/chat.service.js';

// El streaming usa el mismo esquema que la ruta sin streaming (ver "Con el esquema, el prompt..."
// en chat.service.js), solo con "respuesta" al final: así el modelo manda los campos de decisión
// antes del texto. Si algún día se editan por separado, este test avisa que se desalinearon.
describe('paridad del esquema JSON (stream vs. sin streaming)', () => {
  it('mismo nombre, estrictez y forma del objeto', () => {
    assert.equal(ESQUEMA_SALIDA_STREAM.name, ESQUEMA_SALIDA.name);
    assert.equal(ESQUEMA_SALIDA_STREAM.strict, ESQUEMA_SALIDA.strict);
    assert.equal(ESQUEMA_SALIDA_STREAM.schema.type, ESQUEMA_SALIDA.schema.type);
    assert.equal(ESQUEMA_SALIDA_STREAM.schema.additionalProperties, ESQUEMA_SALIDA.schema.additionalProperties);
    assert.deepEqual(ESQUEMA_SALIDA_STREAM.schema.required, ESQUEMA_SALIDA.schema.required);
  });

  it('mismas propiedades, cada una con la misma definición', () => {
    const normal = ESQUEMA_SALIDA.schema.properties;
    const stream = ESQUEMA_SALIDA_STREAM.schema.properties;
    assert.deepEqual(new Set(Object.keys(stream)), new Set(Object.keys(normal)));
    for (const campo of Object.keys(normal)) assert.deepEqual(stream[campo], normal[campo], campo);
  });

  it('"respuesta" va al final en el streaming; los demás campos quedan en el mismo orden', () => {
    const claves = Object.keys(ESQUEMA_SALIDA_STREAM.schema.properties);
    assert.equal(claves.at(-1), 'respuesta');

    const decisionNormal = Object.keys(ESQUEMA_SALIDA.schema.properties).filter((c) => c !== 'respuesta');
    const decisionStream = claves.filter((c) => c !== 'respuesta');
    assert.deepEqual(decisionStream, decisionNormal);
  });
});
