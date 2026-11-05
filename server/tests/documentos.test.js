import 'dotenv/config';
import { describe, it, before, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prisma.js';

// R2, la firma de URLs, la búsqueda y el modelo se simulan; el trámite y sus documentos se crean
// en la base y se borran al terminar.
const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
let enviadosR2;
let firmas;
let candidatos = [];
let llamadasModelo = [];

mock.module(servicio('config/r2.js'), {
  namedExports: {
    R2_BUCKET: 'bucket-test',
    r2: { send: async (comando) => { enviadosR2.push({ tipo: comando.constructor.name, key: comando.input.Key }); } },
  },
});
mock.module('@aws-sdk/s3-request-presigner', {
  namedExports: { getSignedUrl: async (_cliente, comando) => { firmas.push(comando.input.Key); return `https://r2.test.invalid/${comando.input.Key}`; } },
});
mock.module(servicio('services/busqueda.service.js'), { namedExports: { buscarTramites: async () => candidatos } });
mock.module(servicio('services/metrica.service.js'), {
  namedExports: { registrarConsulta: async () => ({ id: 1, calificarToken: 'token' }) },
});
mock.module(servicio('core/ai/index.js'), {
  namedExports: {
    ia: {
      generarRespuesta: async (args) => {
        llamadasModelo.push(args);
        return JSON.stringify({ tipo: 'respuesta', respuesta: 'Podés descargar el formulario.', saludo: '', tramiteId: candidatos[0]?.id ?? null, tramitesUsados: [], opciones: [] });
      },
    },
  },
});

const controller = await import('../src/controllers/documento.controller.js');
const { subirDocumentoSchema, actualizarDocumentoSchema } = await import('../src/validators/documento.validator.js');
const { eliminarTramite } = await import('../src/services/tramite.service.js');
const { responderConsulta } = await import('../src/services/chat.service.js');
const cache = await import('../src/services/cache.service.js');

const DOMINIO = '@documentos.test.invalid';
const SUFIJO = `documentos-test-${Date.now()}`;
const PDF = { originalname: 'formulario.pdf', mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.4') };
const ENLACE = 'https://www.formosa.gob.ar/archivos/formulario.pdf';
let encargado;
let sector;
let tramite;

const respuesta = () => {
  const res = {
    status(codigo) { res.codigo = codigo; return res; },
    send() { return res; },
    json(cuerpo) { res.cuerpo = cuerpo; res.codigo ??= 200; return res; },
  };
  return res;
};
const llamar = async (accion, req) => {
  const res = respuesta();
  await controller[accion]({ tramite: { id: tramite.id }, body: {}, ...req, params: { id: String(tramite.id), ...req.params } }, res);
  return res;
};
const alta = (req) => llamar('subir', req);
const fila = (id) => prisma.documento.findUnique({ where: { id } });
const de = (tipo) => enviadosR2.filter((e) => e.tipo === tipo).map((e) => e.key);

describe('documentos con archivo en R2 o enlace externo', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    encargado = await prisma.usuario.create({ data: { nombre: 'Prueba', email: `encargado${DOMINIO}`, passwordHash: 'x', rol: 'ADMINISTRADOR', estado: 'APROBADO' } });
    sector = await prisma.sector.create({ data: { nombre: SUFIJO, tipo: 'ORGANISMO' } });
    tramite = await prisma.tramite.create({ data: { nombre: `Trámite ${SUFIJO}`, descripcion: 'x', sectorId: sector.id, encargadoId: encargado.id, publicado: true } });
  });

  beforeEach(() => {
    enviadosR2 = [];
    firmas = [];
  });

  after(async () => {
    await prisma.documento.deleteMany({ where: { tramite: { sectorId: sector?.id } } });
    await prisma.tramite.deleteMany({ where: { sectorId: sector?.id } });
    await prisma.sector.deleteMany({ where: { id: sector?.id } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  describe('validación', () => {
    it('acepta solo URLs http o https con host', () => {
      for (const url of ['https://x.org/a.pdf', 'http://x.org']) assert.equal(subirDocumentoSchema.safeParse({ urlExterna: url }).success, true, url);
      for (const url of ['ftp://x.org/a.pdf', 'javascript:alert(1)', 'data:text/html,hola', 'x.org/a.pdf', 'https://', '']) {
        assert.equal(subirDocumentoSchema.safeParse({ urlExterna: url }).success, false, url);
        assert.equal(actualizarDocumentoSchema.safeParse({ urlExterna: url }).success, false, url);
      }
    });

    it('la base exige exactamente un archivo o una URL', async () => {
      await assert.rejects(prisma.documento.create({ data: { nombre: 'ninguno', tramiteId: tramite.id } }));
      await assert.rejects(prisma.documento.create({ data: { nombre: 'los dos', archivo: 'documentos/x.pdf', urlExterna: ENLACE, tramiteId: tramite.id } }));
    });
  });

  describe('alta', () => {
    it('un enlace se crea sin tocar R2 y la API devuelve la URL pero nunca la clave', async () => {
      const res = await alta({ body: { nombre: 'Formulario externo', urlExterna: ` ${ENLACE} ` } });
      assert.equal(res.codigo, 201);
      assert.equal(res.cuerpo.urlExterna, ENLACE);
      assert.equal('archivo' in res.cuerpo, false);
      assert.deepEqual(enviadosR2, []);
      const guardado = await fila(res.cuerpo.id);
      assert.equal(guardado.archivo, null);
      assert.equal(guardado.tipo, null);
    });

    it('un archivo se sube a R2', async () => {
      const res = await alta({ file: PDF });
      assert.equal(res.codigo, 201);
      assert.equal(res.cuerpo.nombre, 'formulario.pdf');
      assert.equal(res.cuerpo.urlExterna, null);
      const [key] = de('PutObjectCommand');
      assert.match(key, /^documentos\/.+\.pdf$/);
      assert.equal((await fila(res.cuerpo.id)).archivo, key);
    });

    it('rechaza los dos a la vez, ninguno o un enlace sin nombre', async () => {
      await assert.rejects(alta({ file: PDF, body: { urlExterna: ENLACE } }), { statusCode: 400 });
      await assert.rejects(alta({}), { statusCode: 400 });
      await assert.rejects(alta({ body: { urlExterna: ENLACE } }), { statusCode: 400, message: /nombre/ });
      await assert.rejects(alta({ body: { nombre: 'x', urlExterna: 'ftp://x.org' } }), { name: 'ZodError' });
      assert.deepEqual(enviadosR2, []);
    });
  });

  describe('descarga', () => {
    it('un enlace devuelve la URL externa sin firmar nada', async () => {
      const { cuerpo } = await alta({ body: { nombre: 'Enlace', urlExterna: ENLACE } });
      const res = await llamar('descargar', { params: { docId: String(cuerpo.id) } });
      assert.deepEqual(res.cuerpo, { url: ENLACE, externa: true });
      assert.deepEqual(firmas, []);
    });

    it('un archivo devuelve una URL firmada de R2', async () => {
      const { cuerpo } = await alta({ file: PDF });
      const key = (await fila(cuerpo.id)).archivo;
      const res = await llamar('descargar', { params: { docId: String(cuerpo.id) } });
      assert.deepEqual(res.cuerpo, { url: `https://r2.test.invalid/${key}`, externa: false });
      assert.deepEqual(firmas, [key]);
    });

    it('una URL guardada que no es válida da 409 y no se devuelve', async () => {
      const doc = await prisma.documento.create({ data: { nombre: 'roto', urlExterna: 'https://', tramiteId: tramite.id } });
      await assert.rejects(llamar('descargar', { params: { docId: String(doc.id) } }), { statusCode: 409 });
      assert.deepEqual(firmas, []);
    });
  });

  describe('edición', () => {
    it('de archivo a enlace: actualiza el registro y después borra el archivo de R2', async () => {
      const { cuerpo } = await alta({ file: PDF });
      const key = (await fila(cuerpo.id)).archivo;
      enviadosR2 = [];
      const res = await llamar('actualizar', { params: { docId: String(cuerpo.id) }, body: { urlExterna: ENLACE } });
      assert.equal(res.cuerpo.urlExterna, ENLACE);
      const guardado = await fila(cuerpo.id);
      assert.deepEqual([guardado.archivo, guardado.urlExterna, guardado.tipo], [null, ENLACE, null]);
      assert.deepEqual(de('DeleteObjectCommand'), [key]);
    });

    it('de enlace a archivo: sube el archivo y no borra nada', async () => {
      const { cuerpo } = await alta({ body: { nombre: 'Enlace', urlExterna: ENLACE } });
      const res = await llamar('actualizar', { params: { docId: String(cuerpo.id) }, file: PDF });
      assert.equal(res.cuerpo.urlExterna, null);
      assert.equal(res.cuerpo.tipo, 'application/pdf');
      assert.equal(de('PutObjectCommand').length, 1);
      assert.deepEqual(de('DeleteObjectCommand'), []);
      assert.equal((await fila(cuerpo.id)).archivo, de('PutObjectCommand')[0]);
    });

    it('reemplazar el archivo borra el anterior; cambiar solo el nombre no toca R2', async () => {
      const { cuerpo } = await alta({ file: PDF });
      const anterior = (await fila(cuerpo.id)).archivo;
      enviadosR2 = [];
      await llamar('actualizar', { params: { docId: String(cuerpo.id) }, file: PDF });
      assert.deepEqual(de('DeleteObjectCommand'), [anterior]);

      enviadosR2 = [];
      const res = await llamar('actualizar', { params: { docId: String(cuerpo.id) }, body: { nombre: 'Nuevo nombre' } });
      assert.equal(res.cuerpo.nombre, 'Nuevo nombre');
      assert.deepEqual(enviadosR2, []);
    });

    it('rechaza archivo y URL juntos, un cuerpo vacío y un documento de otro trámite', async () => {
      const { cuerpo } = await alta({ body: { nombre: 'Enlace', urlExterna: ENLACE } });
      await assert.rejects(llamar('actualizar', { params: { docId: String(cuerpo.id) }, file: PDF, body: { urlExterna: ENLACE } }), { statusCode: 400 });
      await assert.rejects(llamar('actualizar', { params: { docId: String(cuerpo.id) } }), { statusCode: 400 });
      await assert.rejects(llamar('actualizar', { params: { id: String(tramite.id + 100000), docId: String(cuerpo.id) }, body: { nombre: 'x' } }), { statusCode: 404 });
      assert.deepEqual(enviadosR2, []);
    });
  });

  describe('borrado', () => {
    it('un enlace se borra sin llamar a R2; un archivo borra su clave', async () => {
      const enlace = (await alta({ body: { nombre: 'Enlace', urlExterna: ENLACE } })).cuerpo;
      const archivo = (await alta({ file: PDF })).cuerpo;
      const key = (await fila(archivo.id)).archivo;
      enviadosR2 = [];

      assert.equal((await llamar('eliminar', { params: { docId: String(enlace.id) } })).codigo, 204);
      assert.deepEqual(enviadosR2, []);
      assert.equal((await llamar('eliminar', { params: { docId: String(archivo.id) } })).codigo, 204);
      assert.deepEqual(de('DeleteObjectCommand'), [key]);
      assert.equal(await fila(enlace.id), null);
    });

    it('borrar un trámite borra de R2 solo las claves de sus archivos', async () => {
      const otro = await prisma.tramite.create({ data: { nombre: `Otro ${SUFIJO}`, descripcion: 'x', sectorId: sector.id, encargadoId: encargado.id } });
      await prisma.documento.create({ data: { nombre: 'enlace', urlExterna: ENLACE, tramiteId: otro.id } });
      await prisma.documento.create({ data: { nombre: 'archivo', archivo: 'documentos/otro.pdf', tipo: 'application/pdf', tramiteId: otro.id } });
      enviadosR2 = [];
      await eliminarTramite(otro.id);
      assert.deepEqual(enviadosR2, [{ tipo: 'DeleteObjectCommand', key: 'documentos/otro.pdf' }]);
    });
  });

  it('el chat nombra los documentos, archivos y enlaces, sin pasarle la URL al modelo', async () => {
    const solo = await prisma.tramite.create({ data: { nombre: `Chat ${SUFIJO}`, descripcion: 'x', sectorId: sector.id, encargadoId: encargado.id } });
    await prisma.documento.create({ data: { nombre: 'Formulario en PDF', archivo: 'documentos/chat.pdf', tipo: 'application/pdf', tramiteId: solo.id } });
    await prisma.documento.create({ data: { nombre: 'Formulario en la web', urlExterna: ENLACE, tramiteId: solo.id } });
    candidatos = [{ id: solo.id }];
    cache.limpiar({ propagar: false });

    const r = await responderConsulta([{ rol: 'usuario', texto: `¿qué formularios tiene ${SUFIJO}?` }]);
    assert.equal(r.encontrado, true);
    const [, contexto] = llamadasModelo.at(-1).instruccionSistema.split('Contexto (trámites candidatos):');
    assert.match(contexto, /Formularios descargables: (Formulario en (PDF|la web)(, )?){2}/);
    assert.equal(contexto.includes(ENLACE), false);
  });
});
