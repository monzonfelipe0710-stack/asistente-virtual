import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { limpiarCuerpo } from '../src/utils/cuerpo.js';
import { MENSAJE_LISTA_COLAPSADA, NOMBRES_DE_LUGAR, SIN_OFICINAS, crearVerificador, itemVacio, diceGratuito, montosEn, nombresDeLugar, partirEnOraciones, pideDatoSensible, quedoSinContenido, sinContenidoPropio } from '../src/services/verificacion.service.js';

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

  describe('costo en texto de la ficha del portal', () => {
    it('sus montos están respaldados y la corrección de un monto inventado los usa', () => {
      const t = tramite({ nombre: 'Certificado de Buena Conducta', costoDetalle: 'Estampilla Primera vez: $ 5.000\nEstampilla Renovación: $ 5.000' });
      assert.deepEqual(verificar('La estampilla cuesta $5.000.', [t]), { texto: 'La estampilla cuesta $5.000.', capas: [] });
      assert.deepEqual(verificar('El certificado cuesta $9.000.', [t]), {
        texto: 'El costo del trámite Certificado de Buena Conducta es: Estampilla Primera vez: $ 5.000; Estampilla Renovación: $ 5.000.',
        capas: ['costo'],
      });
    });

    it('el monto calculado con el módulo del portal municipal se puede decir, con el cálculo y la fuente', () => {
      const t = tramite({
        nombre: 'Certificado de Libre Deuda de Tasa Única de Servicios e Impuesto Inmobiliario',
        fuenteUrl: 'https://formosatuciudad.gob.ar/certificado-de-libre-deuda-de-tasa-unica-de-servicios-e-impuesto-inmobiliario',
        costoDetalle: 'Certificado de Libre Deuda: 4 módulos: $4.029,40, calculado con el valor del módulo (servicios varios: $1.007,35) vigente desde 01/10/2026, según el Código Tarifario 2026; fuente: portal oficial, consultado el 06/11/2026\n'
          + 'Libre deuda emitida por Tribunal de Faltas: $ 85 (monto publicado en el portal, puede estar desactualizado; confirmalo en la oficina)',
      });
      for (const linea of [
        'El certificado cuesta 4 módulos, que equivalen a $4.029,40 (módulo de servicios varios a $1.007,35 vigente desde el 01/10/2026, según el Código Tarifario 2026).',
        'Cuesta **$4.029,40**, calculado con el valor del módulo vigente; conviene confirmarlo en la fuente oficial.',
        'El libre deuda del Tribunal de Faltas figura a $85, un monto que puede estar desactualizado: confirmalo en la oficina.',
      ]) {
        assert.deepEqual(verificar(linea, [t]), { texto: linea, capas: [] }, linea);
      }
      assert.deepEqual(verificar('Cuesta $4.400.', [t]).capas, ['costo']);

      const varios = tramite({
        nombre: 'Certificado de Baja de Contribución por Servicios',
        costoDetalle: 'Certificados de Libre Deuda: 4 módulos: $4.029,40\nCertificaciones, copias de Documentos, Constancias Varias: 2,5 módulos: $2.518,38\n'
          + 'Montos calculados con el valor del módulo (servicios varios: $1.007,35) vigente desde 01/10/2026, según el Código Tarifario 2026; fuente: portal oficial, consultado el 06/11/2026.',
      });
      const linea = 'El certificado de libre deuda cuesta $4.029,40 y cada constancia $2.518,38 (módulo de servicios varios a $1.007,35, según el Código Tarifario 2026).';
      assert.deepEqual(verificar(linea, [varios]), { texto: linea, capas: [] });
    });
  });

  describe('respuesta sin contenido', () => {
    it('el relleno solo no es contenido; un dato o un "no está cargado" sí', () => {
      for (const t of [
        '',
        'Para más información, consultá en la mesa de entrada.',
        'Para más detalles sobre el pago, te recomiendo consultar en la fuente oficial.\nRecordá que es importante seguir este procedimiento para asegurar la validez del trámite.',
        '¿Te gustaría saber algo más?',
        '- Podés consultar en la mesa de entrada correspondiente.',
      ]) {
        assert.ok(sinContenidoPropio(t), JSON.stringify(t));
      }
      for (const t of [
        'Llevá el DNI vigente.',
        'El costo del trámite Permiso de Feria no está cargado: consultalo en una mesa de entrada o en la fuente oficial.',
        'Para más información, consultá en la mesa. Se presenta la libreta sanitaria.',
      ]) {
        assert.ok(!sinContenidoPropio(t), JSON.stringify(t));
      }
    });

    it('solo cuenta si la verificación sacó algo', () => {
      const v = crearVerificador({ tramites: [tramite()] });
      assert.equal(quedoSinContenido(v, v('Para más información, consultá en la mesa de entrada.')), false);
      assert.equal(v('Pagá en https://estafa.example.com.'), '');
      assert.equal(quedoSinContenido(v, ''), true);
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
        'Está en el portal https://formosa.gob.ar/tramites/123.',
        'Se tramita en el portal http://www.atpformosa.gob.ar ingresando a ATP en línea.',
        'Iniciá el trámite en el sitio http://www.migraciones.gov.ar/radex/index.html.',
        'Mirá el portal https://gob.ar para más.',
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
      assert.deepEqual(verificar('Está en el sitio https://www.formosa.gob.ar/tramite/1 y el formulario, en el sitio https://docs.formosa.gob.ar/f.pdf.', [t]).capas, []);
    });
  });

  describe('enlaces que el servidor saca', () => {
    it('un ítem de lista al que se le saca el enlace se saca entero, aunque el enlace sea oficial', () => {
      assert.deepEqual(verificar('- Buenos Aires: www.gba.gob.ar/registrodelaspersonas', [tramite()]), { texto: '', capas: ['enlace'] });
      assert.deepEqual(verificar('- Ver [el portal](https://www.formosa.gob.ar/tramite/1)', [tramite()]), { texto: '', capas: ['enlace'] });
      // Un dominio oficial suelto no se saca del texto: el ítem queda.
      assert.deepEqual(verificar('- Catamarca: portal.catamarca.gob.ar/organismos/registro', [tramite()]).capas, []);
      assert.deepEqual(verificar('- Llevá el DNI vigente.', [tramite()]), { texto: '- Llevá el DNI vigente.', capas: [] });
    });

    it('saca la oración que queda rota sin su enlace y deja la que no', () => {
      assert.deepEqual(verificar('Accedé a la plataforma online en industria.formosa.gob.ar.', [tramite()]).capas, [], 'dominio suelto');
      assert.deepEqual(
        verificar('Se pide por la web de cada provincia. Por ejemplo, para Buenos Aires es www.gba.gob.ar/registro, y para CABA es www.buenosaires.gob.ar/registrocivil.', [tramite()]),
        { texto: 'Se pide por la web de cada provincia.', capas: ['enlace'] },
      );
      assert.deepEqual(verificar('Ingresá a las siguientes direcciones: www.gba.gob.ar/registro.', [tramite()]).capas, ['enlace']);
      assert.deepEqual(verificar('Podés consultarlo en la fuente oficial: https://www.formosa.gob.ar/tramite/1.', [tramite()]).capas, []);
    });
  });

  describe('listas con enlaces', () => {
    const FRASE = 'No puedo mostrar el listado completo. Consultá en el Registro Civil de la provincia que corresponda o en la fuente oficial.';
    const limpiar = (texto) => {
      const t = tramite();
      return limpiarCuerpo(texto, { verificar: crearVerificador({ tramites: [t], principales: [t] }) });
    };
    const ENCABEZADO = 'Ingresá a las siguientes direcciones según la provincia:';

    it('la frase fija es la del brief', () => {
      assert.equal(MENSAJE_LISTA_COLAPSADA, FRASE);
    });

    it('una lista con dominios oficiales sueltos, todos, no se toca', () => {
      const lista = `${ENCABEZADO}\n- Catamarca: portal.catamarca.gob.ar/organismos\n- Chaco: mapadelestado.chaco.gob.ar/dependencia/ver/248\n- Corrientes: registrocivilctes.gob.ar`;
      assert.equal(limpiar(lista), lista);
    });

    it('una lista con un dominio que no es oficial se colapsa entera', () => {
      const r = limpiar(`${ENCABEZADO}\n- Catamarca: portal.catamarca.gob.ar/organismos\n- Pagos: pagos-formosa.example.org\n- Chaco: mapadelestado.chaco.gob.ar`);
      assert.equal(r, FRASE);
    });

    it('una lista con dominios sueltos mezclados con enlaces con www o https se colapsa entera', () => {
      const r = limpiar(`${ENCABEZADO}\n- Catamarca: portal.catamarca.gob.ar\n- Buenos Aires: www.gba.gob.ar/registrodelaspersonas\n- Jujuy: https://jujuy.gob.ar/home/\n- Chaco: mapadelestado.chaco.gob.ar\n\nLa solicitud es personal.`);
      assert.equal(r, `${FRASE}\n\nLa solicitud es personal.`);
    });

    it('un ítem sin contenido útil dispara el colapso aunque los demás sean oficiales', () => {
      const r = limpiar(`${ENCABEZADO}\n- Catamarca: portal.catamarca.gob.ar\n- **San Luis**: (más información en la fuente oficial).`);
      assert.equal(r, FRASE);
    });

    it('un dominio oficial suelto dentro de una oración (industria.formosa.gob.ar) no se arrastra', () => {
      const oracion = 'Para realizar el trámite, accedé a la plataforma online en industria.formosa.gob.ar.';
      assert.equal(limpiar(oracion), oracion);
      assert.equal(limpiar(`Se hace así:\n- Entrá a industria.formosa.gob.ar\n- Cargá los datos`), 'Se hace así:\n- Entrá a industria.formosa.gob.ar\n- Cargá los datos');
    });

    it('itemVacio: solo el rótulo o un rótulo con relleno; un ítem con dato no', () => {
      for (const item of ['- Buenos Aires:', '- **San Luis**: (más información en la fuente oficial).', '1. Chaco: Para más detalles, consultar', '- Salta: Consultar en la fuente oficial', '- ---']) {
        assert.ok(itemVacio(item), item);
      }
      for (const item of ['- Catamarca: portal.catamarca.gob.ar', '- Llevá el DNI vigente.', '- DNI', '- Costo: $3000', '- Horario: de 7 a 13']) {
        assert.ok(!itemVacio(item), item);
      }
    });
  });

  describe('atribución', () => {
    const cdr = 'CDR - Centro de Documentación Rápida - Oficina: Sarmiento 968';
    const dni = tramite({ id: 90, nombre: 'Nuevo Ejemplar para Argentinos', descripcion: 'Trámite personal para obtener un nuevo ejemplar del DNI.', mesas: [] });
    const pasaporte = tramite({ id: 143, nombre: 'Pasaporte', descripcion: 'Se tramita en el Centro de Documentación Rápida.', mesas: [{ mesa: { nombre: cdr } }] });
    const contexto = new Map([
      [90, '### Trámite (id 90): Nuevo Ejemplar para Argentinos\nOrganismo: Dirección del Registro Civil y Capacidad de las Personas\nDescripción: Trámite personal para obtener un nuevo ejemplar del DNI.\nMesas de entrada (oficinas): no cargadas para este trámite'],
      [143, `### Trámite (id 143): Pasaporte\nOrganismo: Dirección del Registro Civil y Capacidad de las Personas\nDescripción: Se tramita en el Centro de Documentación Rápida.\nMesas de entrada:\n- ${cdr}`],
    ]);
    const conAtribucion = (linea, { principales = [dni], pregunta = 'dónde hago el nuevo ejemplar del DNI' } = {}) => {
      const correcciones = [];
      const v = crearVerificador({ tramites: [dni, pasaporte], principales, atribucion: { contexto, fijo: 'Sos el asistente.', pregunta }, alCorregir: (c) => correcciones.push(c) });
      return { texto: v(linea), capas: correcciones.map((c) => c.capa), v };
    };

    it('un lugar que solo figura en otro candidato se reemplaza si el trámite no tiene oficinas, una sola vez', () => {
      const { texto, capas } = conAtribucion('El trámite es personal. Tenés que acercarte a una oficina del Registro Civil o a un Centro de Documentación Rápida. También podés ir a la oficina de Sarmiento 968.');
      assert.equal(texto, `El trámite es personal. ${SIN_OFICINAS}`);
      assert.deepEqual(capas, ['atribucion', 'atribucion']);
    });

    it('si el trámite tiene oficinas, la oración se saca', () => {
      const conMesas = { ...dni, mesas: [{ mesa: { nombre: 'Delegación Clorinda' } }] };
      const correcciones = [];
      const v = crearVerificador({ tramites: [conMesas, pasaporte], principales: [conMesas], atribucion: { contexto, fijo: '', pregunta: '' }, alCorregir: (c) => correcciones.push(c) });
      assert.equal(v('Llevá el DNI. Andá al Centro de Documentación Rápida.'), 'Llevá el DNI.');
      assert.equal(v.quitadas(), 1);
    });

    it('no toca lo que figura en el trámite elegido, en la pregunta o en lo fijo, ni el vocabulario común', () => {
      for (const oracion of [
        'Se hace en la Dirección del Registro Civil y Capacidad de las Personas.',
        'Acercate a una oficina del Registro Civil de Formosa.',
        'Fotocopia del DNI de los padres.',
        'Documento Nacional de Identidad del titular.',
        'Centro de Documentación Rápida.',
      ]) {
        assert.deepEqual(conAtribucion(oracion).capas, [], oracion);
      }
      assert.deepEqual(conAtribucion('Andá al Centro de Documentación Rápida.', { pregunta: '¿lo hago en el Centro de Documentación Rápida?' }).capas, []);
      assert.deepEqual(conAtribucion('Andá al Centro de Documentación Rápida.', { principales: [dni, pasaporte] }).capas, []);
    });

    it('sin trámite elegido o sin el contexto no se aplica', () => {
      assert.deepEqual(conAtribucion('Andá al Centro de Documentación Rápida.', { principales: [] }).capas, []);
      assert.deepEqual(verificar('Andá al Centro de Documentación Rápida.', [dni, pasaporte], [dni]).capas, []);
    });

    it('los nombres de lugar incluyen los de los municipios y una calle con número o una sigla', () => {
      for (const p of ['secretaria', 'municipalidad', 'direccion', 'departamento', 'hospital', 'comisaria', 'delegacion', 'centro', 'oficina']) {
        assert.ok(NOMBRES_DE_LUGAR.has(p), p);
      }
      assert.deepEqual(nombresDeLugar('Andá a la Municipalidad de Clorinda o al Hospital Distrital.'), ['Municipalidad de Clorinda', 'Hospital Distrital']);
      assert.deepEqual(nombresDeLugar('La oficina queda en Sarmiento 968 y la sede es el CDR.'), ['Sarmiento', 'CDR']);
      assert.deepEqual(nombresDeLugar('Fotocopia del DNI de los padres. Requisitos: Partida de Nacimiento.'), ['DNI']);
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
        // Dicho como requisito de un sistema (lo escribió el modelo en eval-seguridad, grupo D).
        'La reserva del turno se realiza a través de un sistema que requiere tu número de tarjeta de crédito, la fecha de vencimiento y el código de seguridad.',
        'El sistema exige el número de tu tarjeta de crédito.',
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
        'El trámite no requiere tu tarjeta de crédito.',
        'El sistema requiere tu DNI y tu CUIL.',
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
