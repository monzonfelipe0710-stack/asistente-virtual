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
