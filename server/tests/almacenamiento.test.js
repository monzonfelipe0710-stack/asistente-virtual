import './helpers/base-de-prueba.js';
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';

// El cliente de S3 se simula: `responder` decide qué pasa con cada comando.
let responder;
mock.module(new URL('../src/config/r2.js', import.meta.url).href, {
  namedExports: {
    R2_BUCKET: 'bucket-secreto',
    r2: { send: (comando, opciones) => responder(comando, opciones) },
  },
});

const { almacenamientoR2 } = await import('../src/core/almacenamiento/r2.adapter.js');
const { ErrorAlmacenamiento } = await import('../src/core/almacenamiento/errores.js');
const { nombreDeDescarga, disposicionDeDescarga } = await import('../src/utils/nombre-archivo.js');

const CLAVE = 'documentos/clave-interna.pdf';
const errorSdk = (name, estado) => Object.assign(new Error(`${name} en bucket-secreto/${CLAVE}`), { name, $metadata: { httpStatusCode: estado } });
const sinDatosInternos = (err) => {
  for (const texto of [err.message, err.causa, err.stack]) {
    assert.equal(texto.includes('bucket-secreto'), false);
    assert.equal(texto.includes(CLAVE), false);
  }
  assert.equal(err.cause, undefined);
};

describe('adaptador de almacenamiento R2: leer', () => {
  it('devuelve el cuerpo, el tipo y el largo del objeto', async () => {
    responder = async (comando) => ({ Body: Readable.from(['x']), ContentType: 'application/pdf', ContentLength: 1, pedido: comando.input });
    const objeto = await almacenamientoR2.leer(CLAVE);
    assert.equal(objeto.tipo, 'application/pdf');
    assert.equal(objeto.largo, 1);
    assert.ok(objeto.cuerpo instanceof Readable);
  });

  it('un objeto que no existe devuelve null', async () => {
    responder = async () => { throw errorSdk('NoSuchKey', 404); };
    assert.equal(await almacenamientoR2.leer(CLAVE), null);
  });

  it('una falla del proveedor es un ErrorAlmacenamiento sin bucket, clave ni mensaje del SDK', async () => {
    responder = async () => { throw errorSdk('InternalError', 500); };
    const err = await almacenamientoR2.leer(CLAVE).catch((e) => e);
    assert.ok(err instanceof ErrorAlmacenamiento);
    assert.equal(err.tipo, 'proveedor');
    assert.equal(err.causa, 'leer: InternalError 500');
    sinDatosInternos(err);
  });

  it('si R2 no responde a tiempo, corta el pedido y lanza un timeout', async () => {
    let cortado = false;
    responder = (_comando, { abortSignal }) => new Promise((_, rechazar) => {
      abortSignal.addEventListener('abort', () => { cortado = true; rechazar(errorSdk('AbortError')); });
    });
    const err = await almacenamientoR2.leer(CLAVE, { timeoutMs: 20 }).catch((e) => e);
    assert.ok(cortado);
    assert.ok(err instanceof ErrorAlmacenamiento);
    assert.equal(err.tipo, 'timeout');
    sinDatosInternos(err);
  });
});

describe('nombre del archivo descargado', () => {
  it('saca rutas, controles, comillas y marcas de dirección, y pone la extensión del tipo guardado', () => {
    const PDF = 'application/pdf';
    const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    assert.equal(nombreDeDescarga('Formulario de inscripción.pdf', PDF), 'Formulario de inscripción.pdf');
    assert.equal(nombreDeDescarga('Formulario', PDF), 'Formulario.pdf');
    assert.equal(nombreDeDescarga('../../etc/passwd', PDF), 'etc passwd.pdf');
    assert.equal(nombreDeDescarga('a"b\r\nContent-Type: text/html', PDF), 'a b Content-Type text html.pdf');
    assert.equal(nombreDeDescarga(`factura${String.fromCharCode(0x202e)}fdp.exe`, PDF), 'factura fdp.exe.pdf');
    assert.equal(nombreDeDescarga('nota.pdf', DOCX), 'nota.pdf.docx');
    assert.equal(nombreDeDescarga('   ', PDF), 'documento.pdf');
    assert.equal(nombreDeDescarga(null, null), 'documento');
    assert.equal(nombreDeDescarga('x'.repeat(500), PDF), `${'x'.repeat(120)}.pdf`);
  });

  it('el Content-Disposition lleva una versión ASCII y la UTF-8', () => {
    assert.equal(
      disposicionDeDescarga('Inscripción año 2027.pdf'),
      `attachment; filename="Inscripcion ano 2027.pdf"; filename*=UTF-8''Inscripci%C3%B3n%20a%C3%B1o%202027.pdf`,
    );
    assert.equal(disposicionDeDescarga('Señal ✓.pdf'), `attachment; filename="Senal _.pdf"; filename*=UTF-8''Se%C3%B1al%20%E2%9C%93.pdf`);
  });
});
