// Datos de prueba para que el chat tenga trámites sobre los que responder.
//
//   npm run seed:demo           borra los datos de prueba anteriores y los vuelve a crear
//   npm run seed:demo -- --borrar   solo borra los datos de prueba
//
// Todo lo que crea este script se identifica así, y es lo único que borra:
//   - usuarios con email @chatap.test (y los trámites que tengan a cargo)
//   - mesas de entrada y sectores con los nombres listados abajo
//
// Los montos, oficinas y requisitos son ficticios. Genera un embedding por
// trámite con OpenAI, así que necesita OPENAI_API_KEY.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/config/prisma.js';
import { indexarTramite } from '../src/services/embedding.service.js';
import { eliminarTramite } from '../src/services/tramite.service.js';

const DOMINIO = '@chatap.test';
const PASSWORD_DEMO = 'prueba1234';

const SECTORES = [
  { clave: 'ministerio', nombre: 'Ministerio de Economía', tipo: 'MINISTERIO', padre: null },
  { clave: 'rrhh', nombre: 'Subsecretaría de Recursos Humanos', tipo: 'SUBSECRETARIA', padre: 'ministerio' },
  { clave: 'licencias', nombre: 'Departamento de Licencias', tipo: 'DEPARTAMENTO', padre: 'rrhh' },
  { clave: 'haberes', nombre: 'Departamento de Liquidación de Haberes', tipo: 'DEPARTAMENTO', padre: 'rrhh' },
  { clave: 'legajos', nombre: 'Departamento de Legajos y Certificaciones', tipo: 'DEPARTAMENTO', padre: 'rrhh' },
  { clave: 'prevision', nombre: 'Departamento de Previsión Social', tipo: 'DEPARTAMENTO', padre: 'rrhh' },
];

const MESAS = [
  { clave: 'general', nombre: 'Mesa de Entradas General', direccion: 'Edificio central, planta baja', localidad: 'Formosa', esGeneral: true, sector: 'rrhh' },
  { clave: 'licencias', nombre: 'Mesa de Entradas de Licencias', direccion: 'Edificio central, primer piso, oficina 12', localidad: 'Formosa', esGeneral: false, sector: 'licencias' },
  { clave: 'haberes', nombre: 'Mesa de Entradas de Haberes', direccion: 'Edificio central, primer piso, oficina 20', localidad: 'Formosa', esGeneral: false, sector: 'haberes' },
  { clave: 'clorinda', nombre: 'Delegación Clorinda', direccion: 'Oficina de atención al personal', localidad: 'Clorinda', esGeneral: true, sector: 'rrhh' },
];

// Administradores en todos los estados posibles, para probar la gestión de usuarios.
const USUARIOS = [
  { clave: 'mirta', nombre: 'Mirta Benítez', email: `mirta.benitez${DOMINIO}`, estado: 'APROBADO', sectores: ['licencias'] },
  { clave: 'gustavo', nombre: 'Gustavo Acosta', email: `gustavo.acosta${DOMINIO}`, estado: 'APROBADO', sectores: ['haberes'] },
  { clave: 'lorena', nombre: 'Lorena Giménez', email: `lorena.gimenez${DOMINIO}`, estado: 'APROBADO', sectores: ['legajos', 'prevision'] },
  { clave: 'ruben', nombre: 'Rubén Ojeda', email: `ruben.ojeda${DOMINIO}`, estado: 'PENDIENTE', sectores: [] },
  { clave: 'celeste', nombre: 'Celeste Ramírez', email: `celeste.ramirez${DOMINIO}`, estado: 'PENDIENTE', sectores: [] },
  { clave: 'hector', nombre: 'Héctor Villalba', email: `hector.villalba${DOMINIO}`, estado: 'SUSPENDIDO', sectores: ['haberes'] },
  { clave: 'paola', nombre: 'Paola Duarte', email: `paola.duarte${DOMINIO}`, estado: 'RECHAZADO', sectores: [] },
];

const TRAMITES = [
  // Licencias
  {
    nombre: 'Licencia anual ordinaria',
    descripcion: 'Solicitud de las vacaciones anuales que le corresponden al agente según su antigüedad. Se pide con anticipación y debe contar con el visto bueno del superior inmediato.',
    sector: 'licencias', encargado: 'mirta', publicado: true, mesas: ['licencias', 'clorinda'],
    requisitos: [
      { descripcion: 'Formulario de solicitud de licencia anual firmado por el agente', dondeSeConsigue: 'Mesa de Entradas de Licencias' },
      { descripcion: 'Conformidad firmada del superior inmediato', dondeSeConsigue: 'Oficina donde presta servicios el agente' },
      { descripcion: 'Fotocopia del DNI' },
    ],
  },
  {
    nombre: 'Licencia por maternidad',
    descripcion: 'Licencia para la agente gestante, antes y después del parto. También corresponde en casos de adopción. Se inicia con el certificado médico de la fecha probable de parto.',
    sector: 'licencias', encargado: 'mirta', publicado: true, mesas: ['licencias', 'general'],
    requisitos: [
      { descripcion: 'Certificado médico con la fecha probable de parto', dondeSeConsigue: 'Médico tratante u hospital público' },
      { descripcion: 'Partida de nacimiento del hijo o hija, presentada después del parto', dondeSeConsigue: 'Registro Civil', costo: 1200 },
      { descripcion: 'Formulario de solicitud de licencia firmado', dondeSeConsigue: 'Mesa de Entradas de Licencias' },
    ],
  },
  {
    nombre: 'Licencia por paternidad',
    descripcion: 'Licencia para el agente por nacimiento o adopción de un hijo o hija. Debe pedirse dentro de los días hábiles posteriores al nacimiento.',
    sector: 'licencias', encargado: 'mirta', publicado: true, mesas: ['licencias'],
    requisitos: [
      { descripcion: 'Partida de nacimiento o resolución de adopción', dondeSeConsigue: 'Registro Civil o juzgado interviniente', costo: 1200 },
      { descripcion: 'Formulario de solicitud de licencia firmado', dondeSeConsigue: 'Mesa de Entradas de Licencias' },
    ],
  },
  {
    nombre: 'Licencia por enfermedad de corto tratamiento',
    descripcion: 'Justificación de inasistencias por enfermedad o accidente que no está relacionado con el trabajo. El agente debe avisar el mismo día y presentar el certificado dentro de las 48 horas.',
    sector: 'licencias', encargado: 'mirta', publicado: true, mesas: ['licencias', 'clorinda'],
    requisitos: [
      { descripcion: 'Certificado médico con diagnóstico y días de reposo indicados', dondeSeConsigue: 'Médico tratante u hospital público' },
      { descripcion: 'Aviso de inasistencia comunicado a la oficina el mismo día' },
    ],
  },
  {
    nombre: 'Licencia por matrimonio',
    descripcion: 'Licencia con goce de haberes por casamiento o unión convivencial registrada del agente.',
    sector: 'licencias', encargado: 'mirta', publicado: true, mesas: ['licencias'],
    requisitos: [
      { descripcion: 'Acta de matrimonio o constancia de unión convivencial', dondeSeConsigue: 'Registro Civil', costo: 1500 },
      { descripcion: 'Formulario de solicitud de licencia firmado', dondeSeConsigue: 'Mesa de Entradas de Licencias' },
    ],
  },
  {
    nombre: 'Licencia por examen',
    descripcion: 'Días de licencia para rendir exámenes en carreras de nivel terciario o universitario.',
    sector: 'licencias', encargado: 'mirta', publicado: false, mesas: ['licencias'],
    requisitos: [
      { descripcion: 'Constancia de inscripción al examen', dondeSeConsigue: 'Institución educativa' },
      { descripcion: 'Constancia de examen rendido, presentada después', dondeSeConsigue: 'Institución educativa' },
    ],
  },
  // Haberes
  {
    nombre: 'Duplicado de recibo de sueldo',
    descripcion: 'Emisión de una copia del recibo de haberes de un mes determinado, por ejemplo para presentar en un banco o para un crédito.',
    sector: 'haberes', encargado: 'gustavo', publicado: true, mesas: ['haberes', 'general'],
    requisitos: [
      { descripcion: 'Nota simple indicando el mes y año del recibo solicitado' },
      { descripcion: 'Fotocopia del DNI' },
    ],
  },
  {
    nombre: 'Asignación familiar por hijo',
    descripcion: 'Alta de la asignación familiar por cada hijo o hija menor de 18 años, o sin límite de edad en caso de discapacidad. Se cobra junto con el sueldo.',
    sector: 'haberes', encargado: 'gustavo', publicado: true, mesas: ['haberes', 'clorinda'],
    requisitos: [
      { descripcion: 'Partida de nacimiento del hijo o hija', dondeSeConsigue: 'Registro Civil', costo: 1200 },
      { descripcion: 'Fotocopia del DNI del hijo o hija' },
      { descripcion: 'Declaración jurada de cargas de familia', dondeSeConsigue: 'Mesa de Entradas de Haberes' },
      { descripcion: 'Certificado de escolaridad, para mayores de 4 años', dondeSeConsigue: 'Establecimiento educativo' },
    ],
  },
  {
    nombre: 'Bonificación por título',
    descripcion: 'Adicional en el sueldo por título secundario, terciario o universitario. Se liquida desde el mes siguiente a la presentación.',
    sector: 'haberes', encargado: 'gustavo', publicado: true, mesas: ['haberes'],
    requisitos: [
      { descripcion: 'Fotocopia del título legalizada', dondeSeConsigue: 'Institución que emitió el título', costo: 2500 },
      { descripcion: 'Formulario de solicitud de bonificación', dondeSeConsigue: 'Mesa de Entradas de Haberes' },
    ],
    costo: 800,
  },
  {
    nombre: 'Cambio de cuenta bancaria para el cobro de haberes',
    descripcion: 'Modificación de la cuenta donde se deposita el sueldo.',
    sector: 'haberes', encargado: 'gustavo', publicado: false, mesas: ['haberes'],
    requisitos: [
      { descripcion: 'Constancia de CBU emitida por el banco', dondeSeConsigue: 'Banco o home banking' },
      { descripcion: 'Fotocopia del DNI' },
    ],
  },
  // Legajos y certificaciones
  {
    nombre: 'Certificado de servicios',
    descripcion: 'Certificado que acredita los períodos trabajados en la administración pública provincial, los cargos y las remuneraciones. Suele pedirse para jubilarse o para reconocer antigüedad en otro organismo.',
    sector: 'legajos', encargado: 'lorena', publicado: true, mesas: ['general', 'clorinda'],
    requisitos: [
      { descripcion: 'Nota de solicitud indicando para qué se pide el certificado' },
      { descripcion: 'Fotocopia del DNI' },
      { descripcion: 'Sellado provincial', dondeSeConsigue: 'Dirección General de Rentas', costo: 1800 },
    ],
  },
  {
    nombre: 'Constancia de trabajo',
    descripcion: 'Constancia que certifica que la persona trabaja actualmente en la administración pública, con su cargo y antigüedad. Se entrega en el día.',
    sector: 'legajos', encargado: 'lorena', publicado: true, mesas: ['general', 'clorinda'],
    requisitos: [
      { descripcion: 'Fotocopia del DNI' },
      { descripcion: 'Último recibo de sueldo' },
    ],
  },
  {
    nombre: 'Actualización de datos personales del legajo',
    descripcion: 'Cambio de domicilio, estado civil, teléfono o correo electrónico registrados en el legajo personal del agente.',
    sector: 'legajos', encargado: 'lorena', publicado: true, mesas: ['general'],
    requisitos: [
      { descripcion: 'Formulario de actualización de datos', dondeSeConsigue: 'Mesa de Entradas General' },
      { descripcion: 'Documentación que respalde el cambio, por ejemplo certificado de domicilio o acta de matrimonio', dondeSeConsigue: 'Policía de la Provincia o Registro Civil' },
    ],
  },
  {
    nombre: 'Reconocimiento de antigüedad por servicios anteriores',
    descripcion: 'Incorporación al legajo de los años trabajados en otros organismos públicos o en el sector privado, para que se computen en la antigüedad y el adicional correspondiente.',
    sector: 'legajos', encargado: 'lorena', publicado: true, mesas: ['general'],
    requisitos: [
      { descripcion: 'Certificado de servicios del organismo anterior', dondeSeConsigue: 'Organismo donde trabajó' },
      { descripcion: 'Historia laboral de ANSES', dondeSeConsigue: 'ANSES o Mi ANSES' },
      { descripcion: 'Nota de solicitud firmada' },
    ],
  },
  // Previsión social
  {
    nombre: 'Inicio de trámite jubilatorio',
    descripcion: 'Primer paso para iniciar la jubilación ordinaria del agente provincial. La Subsecretaría arma el expediente y lo envía a la caja previsional.',
    sector: 'prevision', encargado: 'lorena', publicado: true, mesas: ['general', 'clorinda'],
    requisitos: [
      { descripcion: 'Certificado de servicios actualizado', dondeSeConsigue: 'Departamento de Legajos y Certificaciones', costo: 1800 },
      { descripcion: 'Fotocopia del DNI' },
      { descripcion: 'Partida de nacimiento', dondeSeConsigue: 'Registro Civil', costo: 1200 },
      { descripcion: 'Últimos tres recibos de sueldo' },
      { descripcion: 'Constancia de CUIL', dondeSeConsigue: 'ANSES o Mi ANSES' },
    ],
  },
];

const nombresSectores = SECTORES.map((s) => s.nombre);
const nombresMesas = MESAS.map((m) => m.nombre);

async function borrarDatosDemo() {
  const usuariosDemo = await prisma.usuario.findMany({
    where: { email: { endsWith: DOMINIO } },
    select: { id: true },
  });
  const ids = usuariosDemo.map((u) => u.id);

  // Por el servicio, para que también se limpien de R2 los documentos que se hayan subido.
  const tramites = await prisma.tramite.findMany({ where: { encargadoId: { in: ids } }, select: { id: true } });
  for (const t of tramites) await eliminarTramite(t.id);

  await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
  await prisma.mesaEntrada.deleteMany({ where: { nombre: { in: nombresMesas } } });

  // Hojas primero; un sector con trámites que no son de prueba se deja y se avisa.
  for (const nombre of [...nombresSectores].reverse()) {
    const sectores = await prisma.sector.findMany({ where: { nombre } });
    for (const s of sectores) {
      try {
        await prisma.sector.delete({ where: { id: s.id } });
      } catch {
        console.warn(`  No se borró el sector "${nombre}": tiene trámites que no son de prueba.`);
      }
    }
  }

  console.log(`Datos de prueba borrados (${tramites.length} trámites, ${ids.length} usuarios).`);
}

async function crearDatosDemo() {
  const sectores = {};
  for (const s of SECTORES) {
    const parentId = s.padre ? sectores[s.padre].id : null;
    sectores[s.clave] =
      (await prisma.sector.findFirst({ where: { nombre: s.nombre, parentId } })) ??
      (await prisma.sector.create({ data: { nombre: s.nombre, tipo: s.tipo, parentId } }));
  }

  const mesas = {};
  for (const m of MESAS) {
    const { clave, sector, ...datos } = m;
    mesas[clave] = await prisma.mesaEntrada.create({ data: { ...datos, sectorId: sectores[sector].id } });
  }

  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
  const usuarios = {};
  for (const u of USUARIOS) {
    usuarios[u.clave] = await prisma.usuario.create({
      data: {
        nombre: u.nombre,
        email: u.email,
        passwordHash,
        rol: 'ADMINISTRADOR',
        estado: u.estado,
        sectores: { create: u.sectores.map((clave) => ({ sectorId: sectores[clave].id })) },
      },
    });
  }

  let indexados = 0;
  for (const t of TRAMITES) {
    const tramite = await prisma.tramite.create({
      data: {
        nombre: t.nombre,
        descripcion: t.descripcion,
        costo: t.costo,
        publicado: t.publicado,
        sectorId: sectores[t.sector].id,
        encargadoId: usuarios[t.encargado].id,
        requisitos: { create: t.requisitos },
        mesas: { create: t.mesas.map((clave) => ({ mesaId: mesas[clave].id })) },
      },
    });

    // A diferencia de la API, acá se espera al embedding: sin él el chat no encuentra el trámite.
    try {
      await indexarTramite(tramite.id);
      indexados++;
      process.stdout.write('.');
    } catch (err) {
      console.warn(`\n  Sin embedding para "${t.nombre}": ${err.message}`);
    }
  }

  const publicados = TRAMITES.filter((t) => t.publicado).length;
  console.log(`\n\nListo: ${SECTORES.length} sectores, ${MESAS.length} mesas, ${USUARIOS.length} usuarios, ${TRAMITES.length} trámites (${publicados} publicados, ${indexados} con embedding).`);
  console.log(`\nAdministradores de prueba (contraseña: ${PASSWORD_DEMO}):`);
  for (const u of USUARIOS) console.log(`  ${u.estado.padEnd(10)} ${u.email}`);
}

async function main() {
  await borrarDatosDemo();
  if (!process.argv.includes('--borrar')) await crearDatosDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
