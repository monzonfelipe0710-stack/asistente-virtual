import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Los caracteres de combinación (U+0300 a U+036F) escritos literalmente son invisibles en el
// editor: en el código tienen que ir con el escape. El rango se arma con fromCharCode para que
// este archivo tampoco los contenga.
const raiz = fileURLToPath(new URL('..', import.meta.url));
const COMBINACION = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`);
const CARPETAS = ['src', 'scripts', 'tests'];

const archivosJs = (carpeta) =>
  readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(carpeta, e.name);
    if (e.isDirectory()) return archivosJs(ruta);
    return e.name.endsWith('.js') ? [ruta] : [];
  });

describe('higiene del código', () => {
  it('ningún archivo tiene caracteres de combinación Unicode escritos literalmente', () => {
    const conProblemas = [];
    for (const archivo of CARPETAS.flatMap((c) => archivosJs(join(raiz, c)))) {
      readFileSync(archivo, 'utf8').split('\n').forEach((linea, i) => {
        if (COMBINACION.test(linea)) conProblemas.push(`${relative(raiz, archivo)}:${i + 1}`);
      });
    }
    assert.deepEqual(conProblemas, [], `Reemplazá los caracteres invisibles por el escape en: ${conProblemas.join(', ')}`);
  });
});
