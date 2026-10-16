import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';

import { consultaSchema } from '../src/controllers/chat.controller.js';
import { MAX_IMAGEN_BYTES, uploadImagenChat } from '../src/middlewares/chat-upload.middleware.js';
import { responderConsulta } from '../src/services/chat.service.js';

const app = express();
app.post('/upload', uploadImagenChat, (req, res) => {
  res.json({ file: req.file ? { mimetype: req.file.mimetype, size: req.file.size } : null });
});
app.use((error, req, res, next) => {
  res.status(error.statusCode || 500).json({ error: error.message });
});

let server;
let baseUrl;

before(async () => {
  server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const enviarImagen = async (bytes, type = 'image/png', filename = 'form.png') => {
  const form = new FormData();
  form.append('pregunta', '¿Está completo este formulario?');
  form.append('imagen', new Blob([bytes], { type }), filename);
  return fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
};

describe('consultaSchema', () => {
  it('requiere una pregunta de 1 a 500 caracteres', () => {
    assert.equal(consultaSchema.safeParse({ pregunta: '¿Cómo hago el trámite?' }).success, true);
    assert.equal(consultaSchema.safeParse({ pregunta: '' }).success, false);
    assert.equal(consultaSchema.safeParse({ pregunta: 'a'.repeat(501) }).success, false);
  });
});

describe('uploadImagenChat', () => {
  it('acepta imágenes JPEG, PNG y WebP con firmas correspondientes', async () => {
    const validImages = [
      [Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg', 'form.jpg'],
      [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png', 'form.png'],
      [Buffer.from('RIFF0000WEBP'), 'image/webp', 'form.webp'],
    ];

    for (const [bytes, type, filename] of validImages) {
      const response = await enviarImagen(bytes, type, filename);
      assert.equal(response.status, 200, type);
    }
  });

  it('rechaza el tipo MIME no permitido', async () => {
    const response = await enviarImagen(Buffer.from('<svg/>'), 'image/svg+xml', 'form.svg');
    assert.equal(response.status, 415);
  });

  it('rechaza bytes que no corresponden con el MIME declarado', async () => {
    const response = await enviarImagen(Buffer.from('not a png'));
    assert.equal(response.status, 400);
  });

  it('aplica el límite de 8 MB al archivo subido', async () => {
    assert.equal(MAX_IMAGEN_BYTES, 8 * 1024 * 1024);
    const response = await enviarImagen(Buffer.alloc(MAX_IMAGEN_BYTES + 1));
    assert.equal(response.status, 413);
  });
});

describe('responderConsulta con imagen', () => {
  it('combina la pregunta, el contexto de trámites y la imagen como data URL', async () => {
    let solicitud;
    const respuesta = await responderConsulta(
      '¿Está completo este formulario?',
      { mimetype: 'image/png', buffer: Buffer.from([1, 2, 3]) },
      {
        buscarTramites: async (pregunta) => {
          assert.equal(pregunta, '¿Está completo este formulario?');
          return [{ id: 9, nombre: 'Solicitud', descripcion: 'Presentar formulario firmado.', costo: null }];
        },
        crearCompletion: async (params) => {
          solicitud = params;
          return { choices: [{ message: { content: 'Parece completo, sujeto a revisión oficial.' } }] };
        },
      }
    );

    const contenido = solicitud.messages[1].content;
    assert.equal(solicitud.model, 'gpt-4o-mini');
    assert.equal(contenido[0].type, 'text');
    assert.match(contenido[0].text, /Presentar formulario firmado/);
    assert.equal(contenido[1].image_url.url, `data:image/png;base64,${Buffer.from([1, 2, 3]).toString('base64')}`);
    assert.match(solicitud.messages[0].content, /no una certificación oficial ni legal/);
    assert.equal(respuesta.encontrado, true);
  });

  it('mantiene el mensaje JSON de texto como contenido simple de usuario', async () => {
    let solicitud;
    await responderConsulta('¿Cómo presento la solicitud?', null, {
      buscarTramites: async () => [
        { id: 3, nombre: 'Solicitud', descripcion: 'Presentar en mesa de entradas.', costo: 0 },
      ],
      crearCompletion: async (params) => {
        solicitud = params;
        return { choices: [{ message: { content: 'Presentala en mesa de entradas.' } }] };
      },
    });

    assert.equal(typeof solicitud.messages[1].content, 'string');
    assert.match(solicitud.messages[1].content, /¿Cómo presento la solicitud\?/);
  });

  it('propaga el fallo del proveedor de modelo', async () => {
    await assert.rejects(
      responderConsulta(
        'Revisá esta imagen',
        { mimetype: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) },
        {
          buscarTramites: async () => [],
          crearCompletion: async () => {
            throw new Error('OpenAI no disponible');
          },
        }
      ),
      { message: 'OpenAI no disponible' }
    );
  });
});
