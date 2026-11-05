import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { aclaracionDeGrupo, formatearGrupo, loQueNombro, resolverGrupos } from '../src/services/variantes.service.js';

const LOCALIDADES = ['Clorinda', 'Pirané', 'Las Lomitas', 'Laguna Blanca', 'Formosa', 'Villa Formosa'];

const jurisdicciones = new Map([
  [1, { nombre: 'Municipalidad de Clorinda', jurisdiccion: 'MUNICIPAL', localidad: 'Clorinda' }],
  [2, { nombre: 'Municipalidad de Pirané', jurisdiccion: 'MUNICIPAL', localidad: 'Pirané' }],
  [3, { nombre: 'Municipalidad de Las Lomitas', jurisdiccion: 'MUNICIPAL', localidad: 'Las Lomitas' }],
  [4, { nombre: 'Dirección de Comercio', jurisdiccion: 'PROVINCIAL', localidad: null }],
  [5, { nombre: 'Municipalidad de la Ciudad de Formosa', jurisdiccion: 'MUNICIPAL', localidad: 'Formosa' }],
  [6, { nombre: 'Auditoría Médica', jurisdiccion: 'PROVINCIAL', localidad: null }],
]);
const grupo = (nombre, sectores) => ({ id: sectores[0] * 100, nombre, variantes: sectores.map((s) => ({ id: s * 100, nombre, sectorId: s })) });
const nada = { localidad: null, jurisdiccion: null };

describe('loQueNombro', () => {
  it('reconoce una localidad sin importar acentos ni mayúsculas', () => {
    assert.deepEqual(loQueNombro('habilitación comercial en PIRANE', LOCALIDADES), { localidad: 'Pirané', jurisdiccion: null });
  });

  it('solo por palabras completas', () => {
    assert.equal(loQueNombro('trámites de clorindas', LOCALIDADES).localidad, null);
  });

  it('gana la última mención, y la más larga si terminan en el mismo lugar', () => {
    assert.equal(loQueNombro('no era Clorinda, es en Las Lomitas', LOCALIDADES).localidad, 'Las Lomitas');
    assert.equal(loQueNombro('en Villa Formosa', LOCALIDADES).localidad, 'Villa Formosa');
  });

  it('"provincia de Formosa" no es la localidad Formosa', () => {
    assert.equal(loQueNombro('trámites de la provincia de Formosa', LOCALIDADES).localidad, null);
    assert.equal(loQueNombro('de la provincia de Formosa, en Formosa capital', LOCALIDADES).localidad, 'Formosa');
  });

  it('reconoce municipal, municipalidad, municipio, provincial y nacional', () => {
    assert.equal(loQueNombro('la municipalidad', []).jurisdiccion, 'MUNICIPAL');
    assert.equal(loQueNombro('el trámite municipal', []).jurisdiccion, 'MUNICIPAL');
    assert.equal(loQueNombro('del municipio', []).jurisdiccion, 'MUNICIPAL');
    assert.equal(loQueNombro('el provincial', []).jurisdiccion, 'PROVINCIAL');
    assert.equal(loQueNombro('el nacional', []).jurisdiccion, 'NACIONAL');
    assert.equal(loQueNombro('la provincia', []).jurisdiccion, null);
  });
});

describe('resolverGrupos', () => {
  it('un grupo con un solo par se resuelve con la mejor variante, aunque tenga copias', () => {
    assert.deepEqual(resolverGrupos([grupo('Licencias médicas', [6, 6, 6])], jurisdicciones, nada), [{ id: 600 }]);
  });

  it('un grupo sin variantes (un solo trámite) queda igual', () => {
    assert.deepEqual(resolverGrupos([{ id: 7 }], jurisdicciones, nada), [{ id: 7 }]);
  });

  it('con varias localidades y ninguna nombrada queda sin resolver, con todas como opciones', () => {
    const [r] = resolverGrupos([grupo('Habilitación comercial', [1, 2, 3])], jurisdicciones, nada);
    assert.equal(r.sinResolver, true);
    assert.deepEqual(r.opciones.map((o) => o.localidad), ['Clorinda', 'Pirané', 'Las Lomitas']);
    assert.equal(r.noEncontrado, null);
  });

  it('con la localidad nombrada elige esa variante', () => {
    assert.deepEqual(resolverGrupos([grupo('Habilitación comercial', [1, 2, 3])], jurisdicciones, { localidad: 'pirane', jurisdiccion: null }), [{ id: 200 }]);
  });

  it('una localidad que no está en el grupo deja todas las opciones y lo avisa', () => {
    const [r] = resolverGrupos([grupo('Habilitación comercial', [1, 2])], jurisdicciones, { localidad: 'Laguna Blanca', jurisdiccion: null });
    assert.equal(r.sinResolver, true);
    assert.equal(r.opciones.length, 2);
    assert.deepEqual(r.noEncontrado, { localidad: 'Laguna Blanca', jurisdiccion: null });
  });

  it('provincial y municipal de una sola localidad son dos pares distintos', () => {
    const [r] = resolverGrupos([grupo('Habilitación comercial', [4, 5])], jurisdicciones, nada);
    assert.equal(r.sinResolver, true);
    assert.deepEqual(r.opciones.map((o) => o.jurisdiccion), ['PROVINCIAL', 'MUNICIPAL']);
  });

  it('"municipal" o "provincial" eligen entre esos pares', () => {
    const g = grupo('Habilitación comercial', [4, 5]);
    assert.deepEqual(resolverGrupos([g], jurisdicciones, { localidad: null, jurisdiccion: 'MUNICIPAL' }), [{ id: 500 }]);
    assert.deepEqual(resolverGrupos([g], jurisdicciones, { localidad: null, jurisdiccion: 'PROVINCIAL' }), [{ id: 400 }]);
  });

  it('"municipal" con varios municipios sigue sin resolver, solo con los municipales', () => {
    const [r] = resolverGrupos([grupo('Habilitación comercial', [4, 1, 2])], jurisdicciones, { localidad: null, jurisdiccion: 'MUNICIPAL' });
    assert.equal(r.sinResolver, true);
    assert.deepEqual(r.opciones.map((o) => o.localidad), ['Clorinda', 'Pirané']);
  });
});

describe('aclaracionDeGrupo', () => {
  it('si difieren por localidad, pregunta la localidad y las opciones ya resuelven', () => {
    const [g] = resolverGrupos([grupo('Habilitación comercial', [1, 2, 3])], jurisdicciones, nada);
    const { texto, opciones } = aclaracionDeGrupo(g);
    assert.match(texto, /¿De qué localidad lo necesitás\? Está cargado para: Clorinda, Pirané o Las Lomitas\./);
    assert.match(texto, /«habilitación comercial en clorinda»/);
    assert.deepEqual(opciones[0], { id: 100, nombre: 'Habilitación comercial en Clorinda', jurisdiccion: 'MUNICIPAL', localidad: 'Clorinda' });
    assert.deepEqual(loQueNombro(opciones[1].nombre, LOCALIDADES).localidad, 'Pirané');
  });

  it('si difieren por jurisdicción, pregunta provincial o municipal', () => {
    const [g] = resolverGrupos([grupo('Habilitación comercial', [4, 5])], jurisdicciones, nada);
    const { texto, opciones } = aclaracionDeGrupo(g);
    assert.equal(texto, 'Hay más de un trámite «Habilitación comercial». ¿Necesitás el trámite provincial o el de la Municipalidad de Formosa?');
    assert.deepEqual(opciones.map((o) => o.nombre), ['Habilitación comercial provincial', 'Habilitación comercial en Formosa']);
  });

  it('avisa cuando la localidad nombrada no está', () => {
    const [g] = resolverGrupos([grupo('Habilitación comercial', [1, 2])], jurisdicciones, { localidad: 'Laguna Blanca', jurisdiccion: null });
    assert.match(aclaracionDeGrupo(g).texto, /^No tengo cargado «Habilitación comercial» para Laguna Blanca\. /);
  });

  it('el contexto del grupo no trae la descripción de ninguna variante', () => {
    const [g] = resolverGrupos([grupo('Habilitación comercial', [4, 5])], jurisdicciones, nada);
    assert.equal(
      formatearGrupo(g),
      'Trámite (id 400): Habilitación comercial\nEstá cargado para varias jurisdicciones o localidades: provincial; municipal, Formosa.\nLa persona no dijo cuál: si pregunta por este trámite, el sistema le pregunta cuál necesita.',
    );
  });
});
