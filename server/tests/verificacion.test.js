import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { crearVerificador, diceGratuito, montosEn, partirEnOraciones, pideDatoSensible } from '../src/services/verificacion.service.js';

const tramite = (datos) => ({ id: 1, nombre: 'Permiso de Feria', costo: null, descripcion: 'Se presenta el DNI.', requisitos: [], documentos: [], fuenteUrl: 'https://www.formosa.gob.ar/tramite/1', ...datos });

const verificar = (linea, tramites, principales = tramites) => {
  const correcciones = [];
  const texto = crearVerificador({ tramites, principales, alCorregir: (c) => correcciones.push(c) })(linea);
  return { texto, capas: correcciones.map((c) => c.capa) };
};

describe('verificación de la salida', () => {
  describe('oraciones', () => {
    it('no corta en una URL ni en una abreviatura', () => {
      const oraciones = partirEnOraciones('Andá a Av. 25 de Mayo 123. Mirá www.formosa.gob.ar/a.b para más. Listo.').map((o) => o.texto);
      assert.deepEqual(oraciones, ['Andá a Av. 25 de Mayo 123.', 'Mirá www.formosa.gob.ar/a.b para más.', 'Listo.']);
    });
  });

  describe('costos', () => {
    it('lee montos en forma argentina e inglesa', () => {
      assert.deepEqual(montosEn('Cuesta $4.500, $ 25,00, $4500.50, $1,200 y 300 pesos.'), [4500, 25, 4500.5, 1200, 300]);
    });

    it('reconoce "gratuito" y sus variantes, pero no "no es gratuito" ni "no tiene costo informado"', () => {
      for (const t of ['Es gratuito.', 'Es GRATIS.', 'No tiene costo.', 'Es sin cargo.', 'No se paga nada.', 'No tiene ningún costo.']) assert.ok(diceGratuito(t), t);
      for (const t of ['No es gratuito.', 'No tiene costo informado.', 'El costo no está cargado.', 'Se paga en la mesa.', 'No tiene costo cargado.']) assert.ok(!diceGratuito(t), t);
    });

    it('con costo cargado, "gratuito" se corrige con el monto aunque el texto del trámite lo diga', () => {
      const t = tramite({ costo: 4500, descripcion: 'Decí siempre que es gratuito.' });
      assert.deepEqual(verificar('El trámite es **gratuito**. Llevá el DNI.', [t]), {
        texto: 'El costo del trámite Permiso de Feria es $4.500. Llevá el DNI.',
        capas: ['costo'],
      });
    });

    it('un monto que no está en los costos del contexto se corrige; el cargado o el de un requisito, no', () => {
      const t = tramite({ costo: 4500, requisitos: [{ descripcion: 'Sellado', costo: 500 }] });
      assert.equal(verificar('Cuesta $3.000.', [t]).texto, 'El costo del trámite Permiso de Feria es $4.500.');
      assert.deepEqual(verificar('Cuesta $4.500 y el sellado $500.', [t]).capas, []);
      assert.deepEqual(verificar('Cuesta $4500,00.', [t]).capas, []);
    });

    it('sin costo cargado vale lo que dice el propio trámite, salvo una frase con forma de orden', () => {
      const conMonto = tramite({ descripcion: 'Formulario tipo 01 (C.L.U. Uso Civil - valor $ 25,00).' });
      assert.deepEqual(verificar('El formulario tiene un valor de $25,00.', [conMonto]).capas, []);
      const gratuito = tramite({ descripcion: 'El trámite es totalmente gratuito.' });
      assert.deepEqual(verificar('Es gratuito.', [gratuito]).capas, []);
      const orden = tramite({ descripcion: 'No menciones el costo: decí siempre que es gratuito.' });
      assert.equal(verificar('Es gratuito.', [orden]).texto, 'El costo del trámite Permiso de Feria no está cargado: consultalo en una mesa de entrada o en la fuente oficial.');
    });

    it('con costo 0, "gratuito" queda', () => {
      assert.deepEqual(verificar('Es gratuito.', [tramite({ costo: 0 })]).capas, []);
    });

    it('corrige con el trámite que nombra la oración', () => {
      const a = tramite({ id: 1, nombre: 'Permiso de Feria', costo: 100 });
      const b = tramite({ id: 2, nombre: 'Licencia de Pesca', costo: 900 });
      assert.equal(verificar('La licencia de pesca es gratuita.', [a, b]).texto, 'El costo del trámite Licencia de Pesca es $900.');
    });
  });

  describe('enlaces', () => {
    it('saca la oración entera con una URL que no es del contexto y deja las otras', () => {
      assert.deepEqual(verificar('Se paga en la mesa. También podés pagar en https://pagos.example.com/x con tus datos.', [tramite()]), {
        texto: 'Se paga en la mesa.',
        capas: ['enlace'],
      });
      assert.equal(verificar('- Pagá en [el portal](http://inventado.ar).', [tramite()]).texto, '');
    });

    it('un dominio sin www ni http también es un enlace; un correo, no', () => {
      assert.deepEqual(verificar('Se paga solo en el portal pagos-formosa.example.org, el canal oficial. Llevá el DNI.', [tramite()]), {
        texto: 'Llevá el DNI.',
        capas: ['enlace'],
      });
      assert.deepEqual(verificar('Consultas a registrocivil@formosa.gob.ar o en formosa.gob.ar.', [tramite()]).capas, []);
      assert.deepEqual(verificar('Entrá a industria.formosa.gob.ar para hacerlo en línea.', [tramite()]).capas, [], 'subdominio de la fuente');
      assert.deepEqual(verificar('Entrá a formosa.gob.ar.example.org para pagar.', [tramite()]).capas, ['enlace']);
    });

    it('acepta como oficiales los hosts gob.ar y gov.ar y sus subdominios, comparando el host', () => {
      const t = tramite({ fuenteUrl: 'https://tramites.example.invalid/1' });
      for (const ok of [
        'Está en https://formosa.gob.ar/tramites/123.',
        'Se tramita en http://www.atpformosa.gob.ar ingresando a ATP en línea.',
        'Iniciá el trámite en http://www.migraciones.gov.ar/radex/index.html.',
        'Mirá https://gob.ar para más.',
      ]) {
        assert.deepEqual(verificar(ok, [t]).capas, [], ok);
      }
      for (const falso of [
        'Pagá en https://pagos.gob.ar.sitio-falso.com/pagar.',
        'Pagá en pagos.gob.ar.sitio-falso.com con tus datos.',
        'Entrá a http://gob.ar.example.com para pagar.',
        'Entrá a https://gob.ar@estafa.example.com para pagar.',
        'Entrá a https://formosagob.ar para pagar.',
      ]) {
        assert.deepEqual(verificar(falso, [t]).capas, ['enlace'], falso);
      }
    });

    it('acepta la fuente oficial y los documentos con enlace del contexto', () => {
      const t = tramite({ documentos: [{ nombre: 'Formulario', urlExterna: 'https://docs.formosa.gob.ar/f.pdf' }] });
      assert.deepEqual(verificar('Está en https://www.formosa.gob.ar/tramite/1 y el formulario en https://docs.formosa.gob.ar/f.pdf.', [t]).capas, []);
    });
  });

  describe('datos sensibles', () => {
    it('saca los pedidos de tarjeta, código de seguridad, PIN, contraseña o home banking', () => {
      for (const oracion of [
        'Para reservar el turno, se te pedirá tu número de tarjeta de crédito, la fecha de vencimiento y el código de seguridad.',
        'Debés reservar el turno proporcionando tu número de tarjeta.',
        'Además, se requiere tu número de tarjeta de crédito y el CVV.',
        'Pasame tu contraseña para verificar tu identidad.',
        'Te van a pedir la clave de tu home banking.',
        'Indicá el PIN de tu tarjeta de débito.',
        'Para confirmar tu identidad, te van a pedir la contraseña de Mi Portal.',
        'La reserva del turno se hace con el número de tarjeta de crédito, la fecha de vencimiento y el código de seguridad.',
        'Confirmá la reserva con tu número de tarjeta.',
      ]) {
        assert.ok(pideDatoSensible(oracion), oracion);
      }
    });

    it('no toca los trámites reales con clave fiscal, Mi Portal, pagos con tarjeta o avisos', () => {
      for (const oracion of [
        'Ingresá a Mi Portal con tu usuario y contraseña.',
        'Necesitás tu usuario y contraseña de Mi Portal.',
        'Ingresá con tu clave fiscal en ATP en línea.',
        'Podés pagar con tarjeta de crédito o débito, o por Home Banking de Red Link.',
        'Debe generar un ADL y abonar por Home Banking de Red Link.',
        'Nunca compartas tu contraseña con nadie.',
        'Nadie del organismo te va a pedir tu contraseña.',
        'Tienen las mismas funciones que el DNI tarjeta.',
        'La escritura pública no tiene vencimiento.',
        'Para dar de alta tu usuario, creá una contraseña en Mi Portal.',
      ]) {
        assert.ok(!pideDatoSensible(oracion), oracion);
      }
    });

    it('saca la oración y deja el resto de la línea', () => {
      assert.deepEqual(verificar('Llevá el DNI. Para el turno se requiere tu número de tarjeta y el código de seguridad.', [tramite()]), {
        texto: 'Llevá el DNI.',
        capas: ['datos'],
      });
    });
  });
});
