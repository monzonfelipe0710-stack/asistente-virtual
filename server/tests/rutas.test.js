import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import tramiteRoutes from '../src/routes/tramite.routes.js';

// Posición de la primera ruta GET con ese path dentro del router.
const posicionGet = (router, path) =>
  router.stack.findIndex((capa) => capa.route?.path === path && capa.route.methods.get);

describe('rutas de trámites', () => {
  it('declara GET /publicados antes de GET /:id para que no lo tome como id', () => {
    const publicados = posicionGet(tramiteRoutes, '/publicados');
    const porId = posicionGet(tramiteRoutes, '/:id');

    assert.notEqual(publicados, -1);
    assert.ok(publicados < porId);
  });
});

describe('rutas de documentos', async () => {
  const { default: documentoRoutes } = await import('../src/routes/documento.routes.js');
  const metodos = (path) => documentoRoutes.stack.filter((c) => c.route?.path === path).flatMap((c) => Object.keys(c.route.methods));

  it('acepta alta, edición y borrado', () => {
    assert.deepEqual(metodos('/').sort(), ['get', 'post']);
    assert.deepEqual(metodos('/:docId').sort(), ['delete', 'patch']);
  });
});
