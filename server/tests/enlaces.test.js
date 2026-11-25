import './helpers/base-de-prueba.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { componerDocumentos, componerFuentes, conFuentes, esUrlHttp, quitarEnlaces, urlDescargaDocumento } from '../src/utils/enlaces.js';

describe('quitarEnlaces', () => {
  it('saca los enlaces en Markdown con su texto y el ":" que los anunciaba', () => {
    assert.equal(
      quitarEnlaces('Consultá la fuente oficial: [Ver el trámite](http://x.gob.ar/tramite/1).'),
      'Consultá la fuente oficial.',
    );
    assert.equal(quitarEnlaces('[Ver el trámite en la fuente oficial](http://x.gob.ar/1)'), '');
    assert.equal(quitarEnlaces('Mirá ![foto](https://x.ar/a.png) acá'), 'Mirá acá');
  });

  it('saca las URL sueltas sin llevarse el punto final', () => {
    assert.equal(quitarEnlaces('Entrá a https://inventado.gob.ar/turnos.'), 'Entrá a.');
    assert.equal(quitarEnlaces('Ver www.formosa.gob.ar/tramite/9, o la mesa.'), 'Ver, o la mesa.');
    assert.equal(quitarEnlaces('Autoenlace <http://x.ar/y> fin'), 'Autoenlace fin');
  });

  it('no toca el texto sin enlaces, ni corchetes o paréntesis comunes', () => {
    for (const texto of ['Requisitos: DNI (original) y [copia].', 'Costo: no informado.', '- **Pasaporte**']) {
      assert.equal(quitarEnlaces(texto), texto);
    }
  });
});

describe('esUrlHttp', () => {
  it('acepta solo http y https', () => {
    assert.equal(esUrlHttp('http://www.formosa.gob.ar/tramite/171/detalle_del_tramite'), true);
    assert.equal(esUrlHttp('https://x.ar'), true);
    for (const url of ['javascript:alert(1)', 'ftp://x.ar', 'data:text/html,hola', 'www.x.ar', '', null, undefined]) {
      assert.equal(esUrlHttp(url), false, String(url));
    }
  });
});

describe('componerFuentes y conFuentes', () => {
  const pasaporte = { nombre: 'Pasaporte', fuenteUrl: 'http://www.formosa.gob.ar/tramite/171/detalle_del_tramite' };

  it('arma una línea por trámite con fuente http(s) y descarta las demás', () => {
    const dni = { nombre: 'DNI [nuevo]', fuenteUrl: 'https://x.ar/a(b)' };
    const sinFuente = { nombre: 'Sin fuente', fuenteUrl: null };
    const peligrosa = { nombre: 'Peligrosa', fuenteUrl: 'javascript:alert(1)' };
    assert.equal(
      componerFuentes([pasaporte, sinFuente, peligrosa, dni]),
      '[Fuente oficial: Pasaporte](http://www.formosa.gob.ar/tramite/171/detalle_del_tramite)\n' +
        '[Fuente oficial: DNI \\[nuevo\\]](https://x.ar/a%28b%29)',
    );
  });

  it('agrega las fuentes después de una línea en blanco, o no agrega nada', () => {
    assert.equal(conFuentes('Así se hace.', [pasaporte]), `Así se hace.\n\n[Fuente oficial: Pasaporte](${pasaporte.fuenteUrl})`);
    assert.equal(conFuentes('Así se hace.', [{ nombre: 'X', fuenteUrl: null }]), 'Así se hace.');
    assert.equal(conFuentes('', [pasaporte]), `[Fuente oficial: Pasaporte](${pasaporte.fuenteUrl})`);
  });

  it('arma una línea por documento con enlace externo http(s) y descarta los que no tienen uno', () => {
    const conDocumentos = {
      ...pasaporte,
      documentos: [
        { nombre: 'Formulario [A]', urlExterna: 'https://docs.formosa.gob.ar/a(1).pdf' },
        { nombre: 'Sin enlace (archivo en R2)', urlExterna: null },
        { nombre: 'Peligroso', urlExterna: 'javascript:alert(1)' },
      ],
    };
    assert.equal(
      componerDocumentos([conDocumentos]),
      '[Formulario: Formulario \\[A\\]](https://docs.formosa.gob.ar/a%281%29.pdf)',
    );
    assert.equal(componerDocumentos([{ ...pasaporte, documentos: [] }]), '');
    assert.equal(componerDocumentos([{ ...pasaporte }]), '', 'sin el campo documentos');
  });

  it('un archivo en R2 se enlaza con la ruta estable de la API, nunca con su clave, y sin SERVIDOR_URL no se enlaza', (t) => {
    const anterior = process.env.SERVIDOR_URL;
    t.after(() => { if (anterior === undefined) delete process.env.SERVIDOR_URL; else process.env.SERVIDOR_URL = anterior; });
    const conArchivo = { ...pasaporte, documentos: [{ id: 42, nombre: 'Formulario en PDF', urlExterna: null, conArchivo: true }, { id: 43, nombre: 'Externo', urlExterna: 'https://docs.formosa.gob.ar/f.pdf', conArchivo: false }] };

    process.env.SERVIDOR_URL = 'https://api.ejemplo.test/';
    assert.equal(urlDescargaDocumento(42), 'https://api.ejemplo.test/api/documentos/42/descargar');
    assert.equal(
      componerDocumentos([conArchivo]),
      '[Formulario: Formulario en PDF](https://api.ejemplo.test/api/documentos/42/descargar)\n[Formulario: Externo](https://docs.formosa.gob.ar/f.pdf)',
    );

    for (const valor of [undefined, '', 'api.ejemplo.test', 'javascript:alert(1)']) {
      if (valor === undefined) delete process.env.SERVIDOR_URL; else process.env.SERVIDOR_URL = valor;
      assert.equal(urlDescargaDocumento(42), null, String(valor));
      assert.equal(componerDocumentos([conArchivo]), '[Formulario: Externo](https://docs.formosa.gob.ar/f.pdf)', String(valor));
    }
  });

  it('conFuentes agrega el enlace de la fuente y, después, el de cada documento con enlace', () => {
    const conDocumentos = { ...pasaporte, documentos: [{ nombre: 'Formulario', urlExterna: 'https://docs.formosa.gob.ar/f.pdf' }] };
    assert.equal(
      conFuentes('Así se hace.', [conDocumentos]),
      `Así se hace.\n\n[Fuente oficial: Pasaporte](${pasaporte.fuenteUrl})\n[Formulario: Formulario](https://docs.formosa.gob.ar/f.pdf)`,
    );
    // Un documento con enlace de un trámite sin fuente oficial: el formulario sale igual.
    const sinFuenteConDocumento = { nombre: 'X', fuenteUrl: null, documentos: [{ nombre: 'Formulario', urlExterna: 'https://docs.formosa.gob.ar/f.pdf' }] };
    assert.equal(conFuentes('Así se hace.', [sinFuenteConDocumento]), 'Así se hace.\n\n[Formulario: Formulario](https://docs.formosa.gob.ar/f.pdf)');
  });
});
