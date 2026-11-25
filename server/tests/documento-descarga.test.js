import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';

import prisma from '../src/config/prisma.js';

// Almacenamiento falso: los objetos viven en un Map; `fallas` hace que leer una clave lance.
const objetos = new Map();
const fallas = new Map();
let leidas = [];
const { ErrorAlmacenamiento } = await import('../src/core/almacenamiento/errores.js');

mock.module(new URL('../src/core/almacenamiento/index.js', import.meta.url).href, {
  namedExports: {
    almacenamiento: {
      subir: async () => {},
      borrar: async () => {},
      urlFirmada: async () => 'https://no.se.usa.invalid',
      leer: async (clave) => {
        leidas.push(clave);
        if (fallas.has(clave)) throw fallas.get(clave);
        const o = objetos.get(clave);
        return o ? { cuerpo: Readable.from([o.contenido]), tipo: o.tipo, largo: o.contenido.length } : null;
      },
    },
  },
});

const { default: express } = await import('express');
const { default: rutas } = await import('../src/routes/documento-descarga.routes.js');
const { errorHandler } = await import('../src/middlewares/error.middleware.js');

const DOMINIO = '@descarga.test.invalid';
const SUFIJO = `descarga-test-${Date.now()}`;
const CLAVE = `documentos/${SUFIJO}.pdf`;
const PDF = Buffer.from('%PDF-1.4 contenido de prueba');
const ENLACE = 'https://www.formosa.gob.ar/archivos/formulario.pdf';
const NO_ENCONTRADO = { error: 'Documento no encontrado.' };

let servidor;
let base;
let encargado;
let sector;
const docs = {};

const pedir = (ruta) => fetch(`${base}/api/documentos/${ruta}`, { redirect: 'manual' });
const capturarErrores = async (fn) => {
  const lineas = [];
  const original = console.error;
  console.error = (...args) => lineas.push(args.map(String).join(' '));
  try {
    return { resultado: await fn(), lineas };
  } finally {
    console.error = original;
  }
};
const sinDatosInternos = (texto) => {
  assert.equal(texto.includes(CLAVE), false);
  assert.equal(texto.includes('documentos/'), false);
  if (process.env.R2_BUCKET) assert.equal(texto.includes(process.env.R2_BUCKET), false);
};
const todoElTexto = async (res) => `${JSON.stringify([...res.headers])}${await res.text()}`;

describe('GET /api/documentos/:id/descargar', () => {
  before(async () => {
    const app = express();
    app.use('/api/documentos', rutas);
    app.use(errorHandler);
    servidor = app.listen(0);
    await new Promise((r) => servidor.once('listening', r));
    base = `http://127.0.0.1:${servidor.address().port}`;

    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    encargado = await prisma.usuario.create({ data: { nombre: 'Prueba', email: `encargado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' } });
    sector = await prisma.sector.create({ data: { nombre: SUFIJO, tipo: 'ORGANISMO' } });
    const tramite = (publicado) => prisma.tramite.create({ data: { nombre: `Trámite ${SUFIJO} ${publicado}`, descripcion: 'x', sectorId: sector.id, encargadoId: encargado.id, publicado } });
    const publicado = await tramite(true);
    const borrador = await tramite(false);
    const documento = (tramiteId, data) => prisma.documento.create({ data: { tramiteId, ...data } });

    docs.archivo = await documento(publicado.id, { nombre: 'Formulario de inscripción.pdf', archivo: CLAVE, tipo: 'application/pdf' });
    docs.borrador = await documento(borrador.id, { nombre: 'Borrador', archivo: `documentos/${SUFIJO}-borrador.pdf`, tipo: 'application/pdf' });
    docs.sinObjeto = await documento(publicado.id, { nombre: 'Huérfano', archivo: `documentos/${SUFIJO}-falta.pdf`, tipo: 'application/pdf' });
    docs.falla = await documento(publicado.id, { nombre: 'Falla', archivo: `documentos/${SUFIJO}-falla.pdf`, tipo: 'application/pdf' });
    docs.enlace = await documento(publicado.id, { nombre: 'Enlace', urlExterna: ENLACE });
    objetos.set(CLAVE, { contenido: PDF, tipo: 'application/pdf' });
    objetos.set(docs.borrador.archivo, { contenido: PDF, tipo: 'application/pdf' });
  });

  beforeEach(() => {
    leidas = [];
    fallas.clear();
  });

  after(async () => {
    await new Promise((r) => servidor.close(r));
    await prisma.documento.deleteMany({ where: { tramite: { sectorId: sector?.id } } });
    await prisma.tramite.deleteMany({ where: { sectorId: sector?.id } });
    await prisma.sector.deleteMany({ where: { id: sector?.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  it('un documento de un trámite publicado se descarga con su nombre saneado y sin datos internos', async () => {
    const res = await pedir(`${docs.archivo.id}/descargar`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/pdf');
    assert.equal(res.headers.get('content-length'), String(PDF.length));
    assert.equal(res.headers.get('cache-control'), 'no-store');
    const disposicion = res.headers.get('content-disposition');
    assert.match(disposicion, /^attachment; filename="Formulario de inscripcion\.pdf"; filename\*=UTF-8''Formulario%20de%20inscripci%C3%B3n\.pdf$/);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), PDF);
    sinDatosInternos(JSON.stringify([...res.headers]));
    assert.deepEqual(leidas, [CLAVE]);
  });

  it('un documento inexistente da 404', async () => {
    const res = await pedir(`${docs.enlace.id + 100000}/descargar`);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), NO_ENCONTRADO);
    assert.deepEqual(leidas, []);
  });

  it('un documento de un trámite despublicado da el mismo 404 sin leer el archivo', async () => {
    const res = await pedir(`${docs.borrador.id}/descargar`);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), NO_ENCONTRADO);
    assert.deepEqual(leidas, []);
  });

  it('un documento sin archivo en R2 da el mismo 404', async () => {
    const res = await pedir(`${docs.sinObjeto.id}/descargar`);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), NO_ENCONTRADO);
    assert.deepEqual(leidas, [docs.sinObjeto.archivo]);
  });

  it('una falla de R2 da 502 y un timeout 503, sin detalles en la respuesta ni en el log, y el server sigue', async () => {
    for (const [error, estado] of [
      [new ErrorAlmacenamiento('leer: InternalError 500'), 502],
      [new ErrorAlmacenamiento('leer: timeout', { tipo: 'timeout' }), 503],
    ]) {
      fallas.set(docs.falla.archivo, error);
      const { resultado: res, lineas } = await capturarErrores(() => pedir(`${docs.falla.id}/descargar`));
      assert.equal(res.status, estado);
      const cuerpo = await res.json();
      assert.deepEqual(Object.keys(cuerpo), ['error']);
      assert.match(cuerpo.error, /no está disponible/);
      sinDatosInternos(JSON.stringify(cuerpo));
      assert.equal(lineas.length, 1);
      sinDatosInternos(lineas.join('\n'));
    }
    assert.equal((await pedir(`${docs.archivo.id}/descargar`)).status, 200);
  });

  it('un id inválido da 404 sin buscar nada', async () => {
    for (const id of ['abc', '0', '-1', '1.5', '1e3', '99999999999', '%20', CLAVE.replace('/', '%2F')]) {
      const res = await pedir(`${id}/descargar`);
      assert.equal(res.status, 404, id);
      assert.deepEqual(await res.json(), NO_ENCONTRADO, id);
    }
    assert.deepEqual(leidas, []);
  });

  it('un documento con enlace externo redirige a ese enlace', async () => {
    const res = await pedir(`${docs.enlace.id}/descargar`);
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), ENLACE);
    assert.deepEqual(leidas, []);
  });

  it('aplica el limitador de las rutas públicas', async () => {
    let ultimo;
    for (let i = 0; i < 70 && ultimo !== 429; i++) {
      const res = await pedir('abc/descargar');
      ultimo = res.status;
      await todoElTexto(res);
    }
    assert.equal(ultimo, 429);
  });
});
