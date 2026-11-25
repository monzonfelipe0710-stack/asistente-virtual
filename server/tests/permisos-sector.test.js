import './helpers/base-de-prueba.js';
import 'dotenv/config';
import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

// Permisos por rol y por sector, por HTTP contra la base de prueba con los middlewares reales. Solo se
// simula el embedding (editar o publicar un trámite lo recalcula en segundo plano). Las consultas son
// de 2017 para que los filtros de fecha no mezclen datos de otros archivos.
const servicio = (ruta) => new URL(`../src/${ruta}`, import.meta.url).href;
mock.module(servicio('services/embedding.service.js'), {
  namedExports: {
    generarEmbedding: async () => [],
    indexarTramite: async () => {},
    indexarSiFalta: async () => false,
    tramitesDeSectores: async () => [],
    reindexarCatalogo: async () => {},
  },
});

const { default: prisma } = await import('../src/config/prisma.js');
const { default: app } = await import('../app.js');

const DOMINIO = '@permisos-sector.test.invalid';
const SUFIJO = `permisos-sector-test-${Date.now()}`;
const RANGO = 'desde=2017-01-01&hasta=2017-12-31';
const INEXISTENTE = 2147483647;
const ESTADOS = ['anonimo', 'ciudadano', 'empleado', 'superusuario'];

let servidor;
let BASE;
const u = {};
const s = {};
const t = {};
const d = {};
const c = {};

const tokenDe = (usuario) => jwt.sign({ id: usuario.id, rol: usuario.rol, pwd: 0 }, process.env.JWT_SECRET, { expiresIn: '10m' });

const pedir = async (metodo, ruta, { como, cuerpo } = {}) => {
  const usuario = como === 'anonimo' ? null : u[como];
  const r = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', ...(usuario && { Authorization: `Bearer ${tokenDe(usuario)}` }) },
    ...(cuerpo && { body: JSON.stringify(cuerpo) }),
  });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { /* no es JSON */ }
  return { status: r.status, texto, json };
};

describe('permisos por rol y por sector', () => {
  before(async () => {
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    const base = { nombre: 'Prueba Permisos', passwordHash: 'x', estado: 'APROBADO' };
    u.ciudadano = await prisma.usuario.create({ data: { ...base, rol: 'CIUDADANO', email: `ciudadano${DOMINIO}`, dni: `9${Date.now()}`.slice(0, 8), cuil: `20${Date.now()}`.slice(0, 11) } });
    u.empleado = await prisma.usuario.create({ data: { ...base, rol: 'ADMINISTRADOR', email: `empleado-a${DOMINIO}` } });
    u.empleadoB = await prisma.usuario.create({ data: { ...base, rol: 'ADMINISTRADOR', email: `empleado-b${DOMINIO}` } });
    u.superusuario = await prisma.usuario.create({ data: { ...base, rol: 'SUPERUSUARIO', email: `super${DOMINIO}` } });

    s.A = await prisma.sector.create({ data: { nombre: `A ${SUFIJO}`, tipo: 'ORGANISMO' } });
    s.B = await prisma.sector.create({ data: { nombre: `B ${SUFIJO}`, tipo: 'ORGANISMO' } });
    await prisma.usuarioSector.createMany({ data: [{ usuarioId: u.empleado.id, sectorId: s.A.id }, { usuarioId: u.empleadoB.id, sectorId: s.B.id }] });

    const tramite = (clave, sector, encargado, publicado) =>
      prisma.tramite.create({ data: { nombre: `${clave} ${SUFIJO}`, descripcion: 'de prueba', sectorId: sector.id, encargadoId: encargado.id, publicado } });
    t.borradorA = await tramite('Borrador A', s.A, u.empleado, false);
    t.publicadoA = await tramite('Publicado A', s.A, u.empleado, true);
    t.borradorB = await tramite('Borrador B', s.B, u.empleadoB, false);
    t.publicadoB = await tramite('Publicado B', s.B, u.empleadoB, true);

    const enlace = (tramiteId) => prisma.documento.create({ data: { nombre: 'Formulario', urlExterna: 'https://example.invalid/f.pdf', tramiteId } });
    d.borradorA = await enlace(t.borradorA.id);
    d.borradorB = await enlace(t.borradorB.id);
    d.publicadoB = await enlace(t.publicadoB.id);

    const consulta = (clave, datos) => prisma.consulta.create({
      data: { textoConsulta: `pregunta ${clave} ${SUFIJO}`, respuesta: 'r', fecha: new Date('2017-06-15T12:00:00Z'), usuarioId: u.ciudadano.id, ...datos },
    });
    c.a1 = await consulta('a1', { tramiteId: t.publicadoA.id, encontrado: true, calificacion: 1, calificarToken: `${SUFIJO}-a1` });
    c.a2 = await consulta('a2', { tramiteId: t.publicadoA.id, encontrado: true, calificarToken: `${SUFIJO}-a2` });
    c.b1 = await consulta('b1', { tramiteId: t.publicadoB.id, encontrado: true, calificacion: 0, motivoCalificacion: 'La respuesta fue confusa', calificarToken: `${SUFIJO}-b1` });
    c.sinRespuesta = await consulta('sin', { tramiteId: null, encontrado: false, calificarToken: `${SUFIJO}-sin` });
    c.aclaracion = await consulta('acl', { tramiteId: null, encontrado: false, tipo: 'aclaracion' });
    c.calificable = await consulta('cal', { tramiteId: null, encontrado: false, fecha: new Date('2016-06-15T12:00:00Z'), calificarToken: `${SUFIJO}-cal` });

    servidor = await new Promise((r) => { const srv = app.listen(0, '127.0.0.1', () => r(srv)); });
    BASE = `http://127.0.0.1:${servidor.address().port}`;
  });

  after(async () => {
    servidor?.close();
    await prisma.consulta.deleteMany({ where: { id: { in: Object.values(c).map((x) => x.id) } } });
    const sectores = [s.A?.id, s.B?.id].filter(Boolean);
    await prisma.documento.deleteMany({ where: { tramite: { sectorId: { in: sectores } } } });
    await prisma.tramite.deleteMany({ where: { sectorId: { in: sectores } } });
    await prisma.sector.deleteMany({ where: { id: { in: sectores } } });
    await prisma.usuario.deleteMany({ where: { email: { endsWith: DOMINIO } } });
    await prisma.$disconnect();
  });

  describe('a nivel de función: cada ruta en los cuatro estados', () => {
    // [método, ruta, cuerpo, { anonimo, ciudadano, empleado, superusuario }]. Los cuerpos inválidos y
    // los ids inexistentes muestran que el rol pasó la autorización sin crear ni cambiar nada.
    const matriz = () => [
      ['GET', '/api/health', null, [200, 200, 200, 200]],
      ['POST', '/api/auth/cambiar-password', {}, [401, 400, 400, 400]],
      ['GET', '/api/usuarios', null, [401, 403, 403, 200]],
      ['POST', '/api/usuarios', {}, [401, 403, 403, 400]],
      ['GET', '/api/usuarios/me/sectores', null, [401, 403, 200, 200]],
      ['GET', `/api/usuarios/${u.empleado.id}/sectores`, null, [401, 403, 403, 200]],
      ['PUT', `/api/usuarios/${u.empleado.id}/sectores`, {}, [401, 403, 403, 400]],
      ['PATCH', `/api/usuarios/${INEXISTENTE}/suspender`, null, [401, 403, 403, 404]],
      ['PATCH', `/api/usuarios/${INEXISTENTE}/reactivar`, null, [401, 403, 403, 404]],
      ['GET', '/api/sectores', null, [401, 403, 200, 200]],
      ['GET', `/api/sectores/${s.B.id}`, null, [401, 403, 200, 200]],
      ['POST', '/api/sectores', {}, [401, 403, 403, 400]],
      ['PATCH', `/api/sectores/${INEXISTENTE}`, {}, [401, 403, 403, 404]],
      ['DELETE', `/api/sectores/${INEXISTENTE}`, null, [401, 403, 403, 404]],
      ['GET', '/api/mesas', null, [401, 403, 200, 200]],
      ['GET', `/api/mesas/${INEXISTENTE}`, null, [401, 403, 404, 404]],
      ['POST', '/api/mesas', {}, [401, 403, 403, 400]],
      ['PATCH', `/api/mesas/${INEXISTENTE}`, {}, [401, 403, 403, 404]],
      ['DELETE', `/api/mesas/${INEXISTENTE}`, null, [401, 403, 403, 404]],
      ['GET', '/api/tramites/publicados', null, [200, 200, 200, 200]],
      ['GET', '/api/tramites', null, [401, 403, 200, 200]],
      ['POST', '/api/tramites', {}, [401, 403, 400, 403]],
      ['GET', `/api/tramites/${t.borradorA.id}`, null, [401, 403, 200, 200]],
      ['PATCH', `/api/tramites/${INEXISTENTE}`, {}, [401, 403, 404, 403]],
      ['DELETE', `/api/tramites/${INEXISTENTE}`, null, [401, 403, 404, 403]],
      ['PATCH', `/api/tramites/${INEXISTENTE}/publicar`, null, [401, 403, 403, 404]],
      ['PATCH', `/api/tramites/${INEXISTENTE}/despublicar`, null, [401, 403, 403, 404]],
      ['GET', `/api/tramites/${t.borradorA.id}/documentos`, null, [404, 404, 200, 200]],
      ['GET', `/api/tramites/${t.publicadoB.id}/documentos`, null, [200, 200, 200, 200]],
      ['POST', `/api/tramites/${INEXISTENTE}/documentos`, {}, [401, 403, 404, 403]],
      ['PATCH', `/api/tramites/${INEXISTENTE}/documentos/1`, {}, [401, 403, 404, 403]],
      ['DELETE', `/api/tramites/${INEXISTENTE}/documentos/1`, null, [401, 403, 404, 403]],
      ['GET', `/api/tramites/${t.borradorA.id}/documentos/${d.borradorA.id}/descargar`, null, [404, 404, 200, 200]],
      ['GET', `/api/documentos/${d.publicadoB.id}/descargar`, null, [302, 302, 302, 302]],
      ['GET', `/api/documentos/${d.borradorA.id}/descargar`, null, [404, 404, 404, 404]],
      ['GET', '/api/metricas/por-tramite', null, [401, 403, 200, 200]],
      ['GET', '/api/metricas/sin-respuesta', null, [401, 403, 200, 200]],
      ['GET', '/api/metricas/calificaciones', null, [401, 403, 200, 200]],
      ['GET', '/api/metricas/resumen', null, [401, 403, 200, 200]],
      ['GET', '/api/consultas/mias', null, [401, 200, 200, 200]],
      ['GET', '/api/consultas/calificaciones', null, [401, 403, 200, 200]],
      ['PATCH', `/api/consultas/${c.calificable.id}/calificar`, { calificacion: 1 }, [404, 200, 404, 404]],
      ['DELETE', `/api/consultas/${INEXISTENTE}`, null, [401, 404, 404, 404]],
      ['GET', '/api/admin/modelos-chat', null, [401, 403, 403, 200]],
      ['GET', '/api/admin/modelos-chat/auditoria', null, [401, 403, 403, 200]],
      ['PUT', '/api/admin/modelos-chat/activo', {}, [401, 403, 403, 400]],
    ];

    it('responde lo esperado para sin sesión, ciudadano, empleado y superusuario', async () => {
      const diferencias = [];
      for (const [metodo, ruta, cuerpo, esperados] of matriz()) {
        for (const [i, como] of ESTADOS.entries()) {
          const { status } = await pedir(metodo, ruta, { como, cuerpo });
          if (status !== esperados[i]) diferencias.push(`${metodo} ${ruta} como ${como}: ${status}, se esperaba ${esperados[i]}`);
        }
      }
      assert.deepEqual(diferencias, []);
    });
  });

  describe('a nivel de objeto: empleado del sector A contra trámites del sector B', () => {
    it('no lee un borrador de B ni sus documentos; un publicado de B sí, como cualquiera', async () => {
      assert.equal((await pedir('GET', `/api/tramites/${t.borradorB.id}`, { como: 'empleado' })).status, 404);
      assert.equal((await pedir('GET', `/api/tramites/${t.borradorB.id}/documentos`, { como: 'empleado' })).status, 404);
      assert.equal((await pedir('GET', `/api/tramites/${t.borradorB.id}/documentos/${d.borradorB.id}/descargar`, { como: 'empleado' })).status, 404);
      assert.equal((await pedir('GET', `/api/tramites/${t.publicadoB.id}`, { como: 'empleado' })).status, 200);

      const ids = (await pedir('GET', '/api/tramites', { como: 'empleado' })).json.map((x) => x.id);
      assert.ok(ids.includes(t.borradorA.id) && ids.includes(t.publicadoB.id));
      assert.ok(!ids.includes(t.borradorB.id));
    });

    it('no edita ni borra trámites de B, publicados o no: 404 y la fila no cambia', async () => {
      for (const tramite of [t.borradorB, t.publicadoB]) {
        const edicion = await pedir('PATCH', `/api/tramites/${tramite.id}`, { como: 'empleado', cuerpo: { nombre: 'Cambiado' } });
        assert.equal(edicion.status, 404);
        assert.deepEqual(edicion.json, { error: 'Trámite no encontrado.' });
        assert.equal((await pedir('DELETE', `/api/tramites/${tramite.id}`, { como: 'empleado' })).status, 404);
        const fila = await prisma.tramite.findUnique({ where: { id: tramite.id } });
        assert.equal(fila.nombre, tramite.nombre);
      }
    });

    it('no publica ni despublica: es solo del superusuario', async () => {
      assert.equal((await pedir('PATCH', `/api/tramites/${t.borradorB.id}/publicar`, { como: 'empleado' })).status, 403);
      assert.equal((await pedir('PATCH', `/api/tramites/${t.publicadoB.id}/despublicar`, { como: 'empleado' })).status, 403);
      assert.equal((await prisma.tramite.findUnique({ where: { id: t.publicadoB.id } })).publicado, true);
    });

    it('no sube, edita ni borra documentos de B, ni cambiando el id del documento en la URL', async () => {
      const antes = await prisma.documento.count({ where: { tramiteId: t.borradorB.id } });
      const enlace = { nombre: 'Intruso', urlExterna: 'https://example.invalid/x.pdf' };
      assert.equal((await pedir('POST', `/api/tramites/${t.borradorB.id}/documentos`, { como: 'empleado', cuerpo: enlace })).status, 404);
      assert.equal((await pedir('PATCH', `/api/tramites/${t.borradorB.id}/documentos/${d.borradorB.id}`, { como: 'empleado', cuerpo: { nombre: 'x' } })).status, 404);
      assert.equal((await pedir('DELETE', `/api/tramites/${t.borradorB.id}/documentos/${d.borradorB.id}`, { como: 'empleado' })).status, 404);
      // Trámite propio en la URL, documento ajeno.
      assert.equal((await pedir('PATCH', `/api/tramites/${t.borradorA.id}/documentos/${d.borradorB.id}`, { como: 'empleado', cuerpo: { nombre: 'x' } })).status, 404);
      assert.equal((await pedir('DELETE', `/api/tramites/${t.borradorA.id}/documentos/${d.borradorB.id}`, { como: 'empleado' })).status, 404);

      assert.equal(await prisma.documento.count({ where: { tramiteId: t.borradorB.id } }), antes);
      assert.equal((await prisma.documento.findUnique({ where: { id: d.borradorB.id } })).nombre, 'Formulario');
    });

    it('no crea trámites en B ni mueve uno propio a B', async () => {
      const alta = await pedir('POST', '/api/tramites', { como: 'empleado', cuerpo: { nombre: `Intruso ${SUFIJO}`, descripcion: 'x', sectorId: s.B.id } });
      assert.equal(alta.status, 403);
      const mover = await pedir('PATCH', `/api/tramites/${t.borradorA.id}`, { como: 'empleado', cuerpo: { sectorId: s.B.id } });
      assert.equal(mover.status, 403);
      assert.equal((await prisma.tramite.findUnique({ where: { id: t.borradorA.id } })).sectorId, s.A.id);
    });

    it('no puede escribir campos de gestión: publicado, encargado ni sector ajeno se ignoran o se rechazan', async () => {
      const r = await pedir('PATCH', `/api/tramites/${t.borradorA.id}`, {
        como: 'empleado',
        cuerpo: { descripcion: 'editada', publicado: true, encargadoId: u.superusuario.id, fuenteUrl: 'https://x.invalid' },
      });
      assert.equal(r.status, 200);
      const fila = await prisma.tramite.findUnique({ where: { id: t.borradorA.id } });
      assert.equal(fila.publicado, false);
      assert.equal(fila.encargadoId, u.empleado.id);
      assert.equal(fila.fuenteUrl, null);
    });

    it('no llega a la gestión de usuarios: ni su rol ni sus sectores', async () => {
      assert.equal((await pedir('PUT', `/api/usuarios/${u.empleado.id}/sectores`, { como: 'empleado', cuerpo: { sectorIds: [s.A.id, s.B.id] } })).status, 403);
      assert.equal((await pedir('POST', '/api/usuarios', { como: 'empleado', cuerpo: { nombre: 'x', email: `otro${DOMINIO}`, password: '12345678' } })).status, 403);
      const sectores = await prisma.usuarioSector.findMany({ where: { usuarioId: u.empleado.id } });
      assert.deepEqual(sectores.map((x) => x.sectorId), [s.A.id]);
      assert.equal((await prisma.usuario.findUnique({ where: { id: u.empleado.id } })).rol, 'ADMINISTRADOR');
    });
  });

  describe('en su propio sector', () => {
    it('el empleado lee, edita, gestiona documentos y borra', async () => {
      assert.equal((await pedir('GET', `/api/tramites/${t.borradorA.id}`, { como: 'empleado' })).status, 200);
      assert.equal((await pedir('PATCH', `/api/tramites/${t.borradorA.id}`, { como: 'empleado', cuerpo: { nombre: `Borrador A ${SUFIJO}` } })).status, 200);

      const alta = await pedir('POST', `/api/tramites/${t.borradorA.id}/documentos`, { como: 'empleado', cuerpo: { nombre: 'Nuevo', urlExterna: 'https://example.invalid/n.pdf' } });
      assert.equal(alta.status, 201);
      assert.equal((await pedir('PATCH', `/api/tramites/${t.borradorA.id}/documentos/${alta.json.id}`, { como: 'empleado', cuerpo: { nombre: 'Renombrado' } })).status, 200);
      const descarga = await pedir('GET', `/api/tramites/${t.borradorA.id}/documentos/${alta.json.id}/descargar`, { como: 'empleado' });
      assert.deepEqual(descarga.json, { url: 'https://example.invalid/n.pdf', externa: true });
      assert.equal((await pedir('DELETE', `/api/tramites/${t.borradorA.id}/documentos/${alta.json.id}`, { como: 'empleado' })).status, 204);

      const nuevo = await pedir('POST', '/api/tramites', { como: 'empleado', cuerpo: { nombre: `Nuevo ${SUFIJO}`, descripcion: 'x', sectorId: s.A.id } });
      assert.equal(nuevo.status, 201);
      assert.equal(nuevo.json.encargadoId, u.empleado.id);
      assert.equal((await pedir('DELETE', `/api/tramites/${nuevo.json.id}`, { como: 'empleado' })).status, 204);
    });

    it('el superusuario lee y publica en cualquier sector, pero no edita trámites (decisión previa)', async () => {
      assert.equal((await pedir('GET', `/api/tramites/${t.borradorB.id}`, { como: 'superusuario' })).status, 200);
      assert.equal((await pedir('GET', `/api/tramites/${t.borradorB.id}/documentos`, { como: 'superusuario' })).status, 200);
      assert.equal((await pedir('PATCH', `/api/tramites/${t.borradorB.id}/publicar`, { como: 'superusuario' })).status, 200);
      assert.equal((await pedir('PATCH', `/api/tramites/${t.borradorB.id}/despublicar`, { como: 'superusuario' })).status, 200);
      assert.equal((await prisma.tramite.findUnique({ where: { id: t.borradorB.id } })).publicado, false);
      assert.equal((await pedir('PATCH', `/api/tramites/${t.borradorB.id}`, { como: 'superusuario', cuerpo: { nombre: 'x' } })).status, 403);
      assert.equal((await pedir('DELETE', `/api/tramites/${t.borradorB.id}`, { como: 'superusuario' })).status, 403);
    });
  });

  describe('métricas', () => {
    const nuestros = (lista) => lista.filter((x) => Object.values(t).some((tr) => tr.id === x.tramiteId));

    it('por trámite: el empleado ve solo su sector, con o sin alcance=propias; el SU todo o el sector que pida', async () => {
      const esperadoA = [{ tramiteId: t.publicadoA.id, nombre: t.publicadoA.nombre, sector: { id: s.A.id, nombre: s.A.nombre }, cantidad: 2 }];
      assert.deepEqual((await pedir('GET', `/api/metricas/por-tramite?${RANGO}`, { como: 'empleado' })).json, esperadoA);
      assert.deepEqual((await pedir('GET', `/api/metricas/por-tramite?${RANGO}&alcance=propias`, { como: 'empleado' })).json, esperadoA);
      assert.deepEqual((await pedir('GET', `/api/metricas/por-tramite?${RANGO}&sectorId=${s.A.id}`, { como: 'empleado' })).json, esperadoA);

      const todo = nuestros((await pedir('GET', `/api/metricas/por-tramite?${RANGO}`, { como: 'superusuario' })).json);
      assert.deepEqual(todo.map((x) => [x.tramiteId, x.cantidad]), [[t.publicadoA.id, 2], [t.publicadoB.id, 1]]);
      const deB = (await pedir('GET', `/api/metricas/por-tramite?${RANGO}&sectorId=${s.B.id}`, { como: 'superusuario' })).json;
      assert.deepEqual(deB.map((x) => [x.tramiteId, x.cantidad]), [[t.publicadoB.id, 1]]);

      assert.deepEqual((await pedir('GET', '/api/metricas/por-tramite?desde=2016-01-01&hasta=2016-12-31', { como: 'empleado' })).json, []);
    });

    it('un empleado que pide un sector ajeno recibe 404; un filtro inválido, 400', async () => {
      for (const ruta of ['/api/metricas/por-tramite', '/api/metricas/sin-respuesta', '/api/metricas/calificaciones', '/api/metricas/resumen', '/api/consultas/calificaciones']) {
        const r = await pedir('GET', `${ruta}?sectorId=${s.B.id}`, { como: 'empleado' });
        assert.equal(r.status, 404, ruta);
        assert.deepEqual(r.json, { error: 'Sector no encontrado.' });
        assert.equal((await pedir('GET', `${ruta}?sectorId=abc`, { como: 'empleado' })).status, 400, ruta);
      }
      assert.equal((await pedir('GET', '/api/metricas/por-tramite?desde=ayer', { como: 'superusuario' })).status, 400);
    });

    it('sin respuesta: el SU las ve sin usuario ni aclaraciones; al empleado no le llegan las de otros', async () => {
      const su = (await pedir('GET', `/api/metricas/sin-respuesta?${RANGO}`, { como: 'superusuario' })).json;
      const ids = su.map((x) => x.id);
      assert.ok(ids.includes(c.sinRespuesta.id));
      assert.ok(!ids.includes(c.aclaracion.id));
      for (const fila of su) assert.deepEqual(Object.keys(fila).sort(), ['encontrado', 'fecha', 'id', 'textoConsulta', 'tramiteId']);

      assert.deepEqual((await pedir('GET', `/api/metricas/sin-respuesta?${RANGO}`, { como: 'empleado' })).json, []);
    });

    it('calificaciones agregadas: el empleado ve las de su sector, sin textos ni usuarios', async () => {
      const r = await pedir('GET', `/api/metricas/calificaciones?${RANGO}`, { como: 'empleado' });
      assert.equal(r.json.total, 1);
      assert.equal(r.json.utiles, 1);
      assert.equal(r.json.promedio, 1);
      assert.deepEqual(r.json.porTramite, [{ tramiteId: t.publicadoA.id, nombre: t.publicadoA.nombre, utiles: 1, noUtiles: 0, total: 1, satisfaccion: 100 }]);
      assert.ok(!r.texto.includes(c.a1.textoConsulta));

      const su = (await pedir('GET', `/api/metricas/calificaciones?${RANGO}`, { como: 'superusuario' })).json;
      assert.ok(su.total >= 2);
      assert.deepEqual(nuestros(su.porTramite).map((x) => [x.tramiteId, x.utiles, x.noUtiles]), [[t.publicadoA.id, 1, 0], [t.publicadoB.id, 0, 1]]);
      const deB = (await pedir('GET', `/api/metricas/calificaciones?${RANGO}&sectorId=${s.B.id}`, { como: 'superusuario' })).json;
      assert.equal(deB.total, 1);
      assert.equal(deB.promedio, 0);
      assert.equal(deB.porMotivo.find((m) => m.motivo === 'La respuesta fue confusa').cantidad, 1);
    });

    it('el listado de calificaciones respeta el sector y no devuelve datos del usuario', async () => {
      const emp = await pedir('GET', `/api/consultas/calificaciones?${RANGO}`, { como: 'empleado' });
      assert.deepEqual(emp.json.items.map((x) => x.id), [c.a1.id]);
      const deB = (await pedir('GET', `/api/consultas/calificaciones?${RANGO}&sectorId=${s.B.id}`, { como: 'superusuario' })).json;
      assert.deepEqual(deB.items.map((x) => x.id), [c.b1.id]);
    });

    it('resumen: aclaraciones aparte de las respuestas; con alcance de sector no se atribuyen', async () => {
      assert.deepEqual((await pedir('GET', `/api/metricas/resumen?${RANGO}`, { como: 'empleado' })).json, {
        respuestas: { total: 2, encontradas: 2, sinRespuesta: null },
        aclaraciones: null,
      });
      assert.deepEqual((await pedir('GET', `/api/metricas/resumen?${RANGO}`, { como: 'superusuario' })).json, {
        respuestas: { total: 4, encontradas: 3, sinRespuesta: 1 },
        aclaraciones: 1,
      });
    });

    it('ninguna respuesta de métricas trae correo, DNI, CUIL ni id del usuario', async () => {
      for (const ruta of ['por-tramite', 'sin-respuesta', 'calificaciones', 'resumen']) {
        for (const como of ['empleado', 'superusuario']) {
          const { texto } = await pedir('GET', `/api/metricas/${ruta}?${RANGO}`, { como });
          for (const dato of [u.ciudadano.email, u.ciudadano.dni, u.ciudadano.cuil, 'usuarioId', 'calificarToken']) {
            assert.ok(!texto.includes(dato), `${ruta} como ${como} trae ${dato}`);
          }
        }
      }
    });
  });
});
