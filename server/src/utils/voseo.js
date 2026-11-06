import { separarEnlaces } from './enlaces.js';

// Red de seguridad: el prompt pide voseo, pero si el modelo igual tutea se corrige acá. Lista
// cerrada de palabras completas; "tu" (posesivo) es igual en voseo y no se toca.
const VOSEO = {
  tienes: 'tenés',
  puedes: 'podés',
  debes: 'debés',
  necesitas: 'necesitás',
  quieres: 'querés',
  sabes: 'sabés',
  vienes: 'venís',
  haces: 'hacés',
  eres: 'sos',
  recuerda: 'recordá',
  'asegúrate': 'asegurate',
  'acércate': 'acercate',
  'fíjate': 'fijate',
  'ten en cuenta': 'tené en cuenta',
};

const TUTEO = new RegExp(
  `(?<![\\p{L}\\p{N}_])(${Object.keys(VOSEO).map((f) => f.replace(/ /g, '\\s+')).join('|')})(?![\\p{L}\\p{N}_])`,
  'giu',
);

const conMayusculaComo = (modelo, texto) =>
  modelo[0] !== modelo[0].toLocaleLowerCase('es') ? texto[0].toLocaleUpperCase('es') + texto.slice(1) : texto;

// Devuelve el texto en voseo y las formas de tuteo que encontró, tal como venían.
export const corregirTuteo = (texto) => {
  const formas = [];
  const corregido = separarEnlaces(texto.normalize('NFC'))
    .map((pedazo, i) =>
      i % 2 === 1
        ? pedazo
        : pedazo.replace(TUTEO, (forma) => {
            formas.push(forma);
            return conMayusculaComo(forma, VOSEO[forma.toLocaleLowerCase('es').replace(/\s+/g, ' ')]);
          }),
    )
    .join('');
  return { texto: corregido, formas };
};
