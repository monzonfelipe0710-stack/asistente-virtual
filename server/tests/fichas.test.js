import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  costoDeFicha, datosDeFicha, documentosDeFicha, informacionAdicionalDeFicha, localidadDeOficina, montoEnPesos, partirRequisitos, trocear,
} from '../src/services/fichas.service.js';
import { costoDelPortal, grupoVacio, huellaDeGrupo } from '../src/utils/huella.js';

const letras = (texto) => texto.normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

describe('costo de la ficha', () => {
  it('una sola fila con "$ N" es el decimal, con la forma argentina', () => {
    assert.deepEqual(costoDeFicha([{ concepto: 'PASAPORTE', importe: '$ 35000' }]), { costo: 35000, costoDetalle: null });
    assert.deepEqual(costoDeFicha([{ concepto: 'Tasa', importe: '$ 5.000' }]), { costo: 5000, costoDetalle: null });
    assert.equal(montoEnPesos('$ 1.234,50'), 1234.5);
    assert.deepEqual(costoDeFicha([{ concepto: 'Gratuito', importe: '$ 0' }]), { costo: 0, costoDetalle: null });
  });

  it('varias filas o importes en UT quedan como texto, una fila por línea', () => {
    assert.deepEqual(costoDeFicha([
      { concepto: 'Estampilla Primera vez', importe: '$ 5.000' },
      { concepto: 'Estampilla Renovación Simple', importe: '$ 5.000' },
    ]), { costo: null, costoDetalle: 'Estampilla Primera vez: $ 5.000\nEstampilla Renovación Simple: $ 5.000' });
    assert.deepEqual(costoDeFicha([{ concepto: 'Sellado', importe: '10 UT (Unidades Tributarias)' }]), { costo: null, costoDetalle: 'Sellado: 10 UT (Unidades Tributarias)' });
  });

  it('"Ninguno" o sin filas no es gratuito: queda sin costo', () => {
    assert.deepEqual(costoDeFicha([{ concepto: 'Ninguno', importe: null }]), { costo: null, costoDetalle: null });
    assert.deepEqual(costoDeFicha([]), { costo: null, costoDetalle: null });
  });
});

describe('partirRequisitos', () => {
  it('corta por números conservando los subgrupos en línea', () => {
    const texto = 'En caso de estar identificado: 1- Fotocopia del DNI (frente y dorso) 2- Estampilla fiscal En caso de no estar identificado: 1- Acta de Nacimiento Actualizada. 2- (02) Fotografías color tipo carnet 3X3. 3- Estampilla fiscal';
    assert.deepEqual(partirRequisitos(texto), [
      'En caso de estar identificado: Fotocopia del DNI (frente y dorso)',
      'En caso de estar identificado: Estampilla fiscal',
      'En caso de no estar identificado: Acta de Nacimiento Actualizada.',
      'En caso de no estar identificado: (02) Fotografías color tipo carnet 3X3.',
      'En caso de no estar identificado: Estampilla fiscal',
    ]);
  });

  it('corta por viñetas con los encabezados de grupo sin dos puntos', () => {
    const texto = 'Para argentinos mayores de edad:\n\n* Documento Nacional de Identidad actualizado.\n\nPara argentinos menores de edad\n\n* DNI actualizado.\n* Partida de nacimiento.';
    assert.deepEqual(partirRequisitos(texto), [
      'Para argentinos mayores de edad: Documento Nacional de Identidad actualizado.',
      'Para argentinos menores de edad: DNI actualizado.',
      'Para argentinos menores de edad: Partida de nacimiento.',
    ]);
  });

  it('un encabezado genérico ("DOCUMENTACIÓN") no se repite en cada ítem', () => {
    assert.deepEqual(partirRequisitos('DOCUMENTACIÓN\n- Fotocopia DNI.\n- Certificación Negativa (ANSES).'), ['Fotocopia DNI.', 'Certificación Negativa (ANSES).']);
  });

  it('los números que no siguen la secuencia son texto', () => {
    const texto = '1. Nota según el Art. 51 del Código. 2. Formulario 010- completo. 3. Tasa de 10 U.T';
    assert.deepEqual(partirRequisitos(texto), ['Nota según el Art. 51 del Código.', 'Formulario 010- completo.', 'Tasa de 10 U.T']);
  });

  it('sin marcas, un único requisito con el texto completo', () => {
    const texto = 'Fotocopia del DNI del titular y del apoderado en caso de tenerlo.';
    assert.deepEqual(partirRequisitos(texto), [texto]);
  });

  it('un texto largo sin marcas se parte en trozos del tope sin perder nada', () => {
    const texto = Array.from({ length: 40 }, (_, i) => `Artículo ${i + 10}: el texto de la norma número ${i} sigue acá.`).join(' ');
    const trozos = partirRequisitos(texto);
    assert.ok(trozos.length > 1);
    assert.ok(trozos.every((t) => t.length <= 1000));
    assert.equal(letras(trozos.join(' ')), letras(texto));
    assert.deepEqual(trocear('corto'), ['corto']);
  });

  it('nunca pierde texto: lo cortado contiene todo el original', () => {
    const texto = 'Requisitos generales: 1- Nota de pedido. 2- Copia del DNI. Además, para sociedades: 1- Estatuto. 2- Acta de designación.';
    const items = partirRequisitos(texto);
    for (const pedazo of ['Nota de pedido', 'Copia del DNI', 'Además', 'Estatuto', 'Acta de designación']) {
      assert.ok(items.some((i) => i.includes(pedazo)), pedazo);
    }
  });
});

describe('oficinas, documentos e información adicional', () => {
  it('la localidad sale del nombre de la seccional, de un tramo exacto o del código postal; si no, null', () => {
    assert.equal(localidadDeOficina({ nombre: 'Seccional Cmte. Fontana Oficina 1481' }), 'Comandante Fontana');
    assert.equal(localidadDeOficina({ nombre: 'Seccional Primera Clorinda Oficina 1479' }), 'Clorinda');
    assert.equal(localidadDeOficina({ nombre: 'Subsecretaría de Producción - Región Pirané Norte - Pirané' }), 'Pirané');
    assert.equal(localidadDeOficina({ nombre: 'Dirección de Asociativismo', domicilio: 'Belgrano N° 505 - CP 3600' }), 'Formosa');
    assert.equal(localidadDeOficina({ nombre: 'Casa de Formosa en Buenos Aires', domicilio: 'H. Yrigoyen 1429 - C.P. 1037 Capital Federal' }), null);
    assert.equal(localidadDeOficina({ nombre: 'Seccional Oficina Volante Oficina 2601' }), null);
  });

  it('los enlaces rotos no se importan como documento y las normas sin enlace van a la información adicional', () => {
    const d = {
      formularios: [{ nombre: 'Formulario A', url: 'https://archivos.formosa.gob.ar/a.pdf', enlace: { estado: 'ok' } }],
      normas: [
        { nombre: 'Ley 1', url: 'https://archivos.formosa.gob.ar/n1.pdf', enlace: { estado: 'roto' } },
        { nombre: 'Ley 2', url: null },
      ],
      modalidad: ['Personal'], duracion: '24 horas', observaciones: 'Validez de 6 meses.',
    };
    const { documentos, rotos } = documentosDeFicha(d);
    assert.deepEqual(documentos, [{ nombre: 'Formulario A', urlExterna: 'https://archivos.formosa.gob.ar/a.pdf', tipo: 'formulario' }]);
    assert.deepEqual(rotos.map((r) => r.nombre), ['Ley 1']);
    assert.equal(informacionAdicionalDeFicha(d), 'Modalidad: Personal\nDuración aproximada: 24 horas\nObservaciones: Validez de 6 meses.\nNormas: Ley 1; Ley 2');
  });

  it('datosDeFicha arma las mesas con su origenId y sin responsables', () => {
    const datos = datosDeFicha({
      costos: [], requisitos: 'Fotocopia del DNI.', verificadoEn: '2026-11-06T04:00:00+00:00',
      oficinas: [{ origenId: 'collapse_1', nombre: 'Seccional Ibarreta Oficina 1491', domicilio: 'Martín Polo 773', telefono: '0370-1', email: 'a@formosa.gob.ar', horario: '7 a 12' }],
    });
    assert.deepEqual(datos.mesas, [{ origenId: 'collapse_1', nombre: 'Seccional Ibarreta Oficina 1491', direccion: 'Martín Polo 773', localidad: 'Ibarreta', horario: '7 a 12', telefono: '0370-1', email: 'a@formosa.gob.ar' }]);
    assert.deepEqual(datos.requisitos, [{ descripcion: 'Fotocopia del DNI.' }]);
    assert.equal(datos.verificadoEn.toISOString(), '2026-11-06T04:00:00.000Z');
  });
});

describe('huella', () => {
  it('es la misma para los mismos datos, venga de Prisma (Decimal) o del JSON', () => {
    assert.equal(huellaDeGrupo('costo', { costo: 5000, costoDetalle: null }), huellaDeGrupo('costo', { costo: '5000.00' }));
    assert.equal(huellaDeGrupo('mesas', { mesaIds: [3, 1] }), huellaDeGrupo('mesas', { mesas: [{ mesaId: 1 }, { mesaId: 3 }] }));
    assert.notEqual(huellaDeGrupo('requisitos', { requisitos: [{ descripcion: 'A' }] }), huellaDeGrupo('requisitos', { requisitos: [{ descripcion: 'B' }] }));
    assert.equal(grupoVacio('costo', { costo: null, costoDetalle: null }), true);
    assert.equal(grupoVacio('requisitos', { requisitos: [] }), true);
  });

  it('el costo es del portal solo si tiene fecha de captura y nadie lo cambió', () => {
    const t = { costo: 35000, costoDetalle: null, verificadoEn: new Date() };
    t.huellaImportacion = { costo: huellaDeGrupo('costo', t) };
    assert.equal(costoDelPortal(t), true);
    assert.equal(costoDelPortal({ ...t, costo: 40000 }), false);
    assert.equal(costoDelPortal({ ...t, verificadoEn: null }), false);
  });
});
