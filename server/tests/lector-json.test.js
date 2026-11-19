import './helpers/base-de-prueba.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { crearLectorDeSalida } from '../src/utils/lector-json.js';

// El lector incremental del JSON del streaming: cortado en cualquier posición da lo mismo que
// JSON.parse del texto completo.
const CAMPOS_META = ['tipo', 'saludo', 'tramiteId', 'tramitesUsados', 'opciones'];
const META = { tipo: 'respuesta', saludo: 'Hola', tramiteId: 7, tramitesUsados: [7, 12], opciones: [] };

const leer = (pedazos) => {
  const lector = crearLectorDeSalida({ campoTexto: 'respuesta', camposMeta: CAMPOS_META });
  const metas = [];
  const textos = [];
  let antesDeLaMeta = '';
  for (const p of pedazos) {
    const { meta, texto } = lector.agregar(p);
    if (metas.length === 0 && meta === null) antesDeLaMeta += texto;
    if (meta !== null) metas.push(meta);
    textos.push(texto);
  }
  return { metas, textos, texto: textos.join(''), antesDeLaMeta, entera: lector.cerrar() };
};

const cortesDe = (crudo) => [
  [crudo],
  ...Array.from({ length: crudo.length - 1 }, (_, i) => [crudo.slice(0, i + 1), crudo.slice(i + 1)]),
  ...[1, 3, 7, 13].map((n) => crudo.match(new RegExp(`[\\s\\S]{1,${n}}`, 'g'))),
];

// Los mismos caracteres, escritos con \uXXXX.
const conEscapesUnicode = (json) => json.replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const sinSustitutosSueltos = (texto) => !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(texto);

const comprobar = (crudo) => {
  const esperado = JSON.parse(crudo);
  const { respuesta, ...meta } = esperado;
  for (const pedazos of cortesDe(crudo)) {
    const como = `cortado en ${JSON.stringify(pedazos.slice(0, 2).map((p) => p.length))} de ${crudo}`;
    const r = leer(pedazos);
    assert.equal(r.texto, respuesta, como);
    assert.deepEqual(r.metas, [meta], como);
    assert.equal(r.antesDeLaMeta, '', como);
    assert.deepEqual(r.entera, esperado, como);
    if (sinSustitutosSueltos(respuesta)) for (const t of r.textos) assert.ok(sinSustitutosSueltos(t), `${como}: medio carácter en ${JSON.stringify(t)}`);
  }
};

const TEXTOS = [
  'Se hace en persona.',
  '',
  'Línea uno.\nLínea dos con "comillas" y una barra \\ invertida.\n\n- ítem\t con tabulación\r\n- otro / más',
  'Acentos y eñes: trámite, cañón, pingüino, ¿cómo?, ¡así! Emoji 😀 pegado😀😀 y una familia 👨‍👩‍👧 al final 🎉',
  '😀',
  'Termina con barra \\',
  'Termina con comilla "',
  'Escapes que parecen otros: \\n no es salto, \\u00e1 no es á, \\" tampoco cierra. {"tipo": "respuesta"} ] } ,',
  'Controles: \u0001\u001f\b\f y un sustituto suelto \ud83d seguido de texto, y otro al final \ud83d',
  'Sustituto bajo suelto \ude00 y un par al revés \ude00\ud83d.',
];

describe('lector incremental del JSON del streaming', () => {
  for (const texto of TEXTOS) {
    it(`igual que JSON.parse en cualquier corte: ${JSON.stringify(texto).slice(0, 60)}`, () => {
      const crudo = JSON.stringify({ ...META, respuesta: texto });
      comprobar(crudo);
      comprobar(conEscapesUnicode(crudo));
    });
  }

  it('con espacios y saltos entre los elementos, valores anidados y claves con escapes', () => {
    comprobar('  {\n  "tipo" : "aclaracion" ,\n "saludo":"Buen \\"día\\" \\\\",\r\n\t"tramiteId" : null,"tramitesUsados":[ 1 , 2,3 ] , "opciones" : [ ] ,\n  "respuesta" : "¿Cuál? \\ud83d\\ude00 \\/ listo"\n}\n ');
    comprobar('{"tipo":"respuesta","saludo":"","tramiteId":-12,"tramitesUsados":[],"opciones":[],"respuesta":"\\u00bfS\\u00ed? \\uD83D\\uDE00"}');
    const lector = crearLectorDeSalida({ campoTexto: 'respuesta', camposMeta: ['datos', 'vale'] });
    const crudo = '{"datos":{"a":[{"b":"} ] \\" ,"}],"c":null},"vale":true,"respuesta":"ok"}';
    let meta = null;
    let texto = '';
    for (const c of crudo) {
      const r = lector.agregar(c);
      meta ??= r.meta;
      texto += r.texto;
    }
    assert.deepEqual(meta, { datos: { a: [{ b: '} ] " ,' }], c: null }, vale: true });
    assert.equal(texto, 'ok');
    assert.deepEqual(lector.cerrar(), JSON.parse(crudo));
  });

  it('un escape de una letra acentuada o de un emoji partido entre pedazos no sale a medias', () => {
    const r = leer(['{"tipo":"respuesta","saludo":"","tramiteId":null,"tramitesUsados":[],"opciones":[],"respuesta":"tr', '\\', 'u00', 'e1mite \\ud', '83d', '\\u', 'de00', ' fin\\', 'n"', '}']);
    assert.deepEqual(r.textos, ['tr', '', '', 'ámite ', '', '', '😀', ' fin', '\n', '']);
    assert.notEqual(r.entera, null);
  });

  it('si "respuesta" llega antes que los demás campos, el texto se retiene hasta tener la meta', () => {
    const ordenes = [
      { respuesta: 'Se hace en persona.\nLlevá el DNI 😀.', ...META },
      { tipo: 'respuesta', saludo: 'Hola', tramiteId: 7, respuesta: 'Se hace en persona.\nLlevá el DNI 😀.', tramitesUsados: [7, 12], opciones: [] },
    ];
    for (const salida of ordenes) comprobar(JSON.stringify(salida));
    const r = leer(['{"respuesta":"Se hace', ' en persona.","tipo":"respuesta","saludo":"","tramiteId":7,', '"tramitesUsados":[7],"opciones":[', ']', '}']);
    assert.deepEqual(r.textos, ['', '', '', 'Se hace en persona.', '']);
    assert.equal(r.metas.length, 1);
  });

  describe('lo que no es el JSON del esquema termina sin validar', () => {
    const completo = JSON.stringify({ ...META, respuesta: 'Se hace en persona.' });
    const invalidos = {
      'cortado a mitad del texto': completo.slice(0, -8),
      'cortado antes de la llave final': completo.slice(0, -1),
      'cortado a mitad de la meta': completo.slice(0, 30),
      'vacío': '',
      'texto suelto': 'Se hace en persona.',
      'texto después del objeto': `${completo} y algo más`,
      'dos objetos': completo + completo,
      'una clave repetida': completo.replace('"saludo":"Hola"', '"saludo":"Hola","saludo":"Chau"'),
      '"respuesta" repetida': completo.replace(/\}$/, ',"respuesta":"Otra."}'),
      '"respuesta" que no es un string': JSON.stringify({ ...META, respuesta: null }),
      'sin "respuesta"': JSON.stringify(META),
      'falta un campo de decisión': JSON.stringify({ tipo: 'respuesta', saludo: '', tramiteId: 7, opciones: [], respuesta: 'Se hace en persona.' }),
      'un escape que no existe': completo.replace('persona', 'per\\sona'),
      'un \\u incompleto': completo.replace('persona', 'per\\u00zzsona'),
      'un salto de línea sin escapar': completo.replace('persona', 'per\nsona'),
      'coma de más': completo.replace(/\}$/, ',}'),
      'un array': `[${completo}]`,
    };
    for (const [nombre, crudo] of Object.entries(invalidos)) {
      it(nombre, () => {
        for (const pedazos of cortesDe(crudo || ' ')) assert.equal(leer(pedazos).entera, null);
      });
    }

    it('lo leído antes de la falla es un prefijo del texto que venía', () => {
      for (let corte = 1; corte < completo.length; corte++) {
        const r = leer([...completo.slice(0, corte)]);
        assert.equal(r.entera, null);
        assert.ok('Se hace en persona.'.startsWith(r.texto));
      }
    });
  });
});
