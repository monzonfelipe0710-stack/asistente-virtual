// Genera un catálogo sintético para probar trámites con el mismo nombre en distintos municipios
// (eval-chat --catalogo sintetico). Se importa SOLO en una base temporal, nunca en la real:
//
//   node scripts/generar-catalogo-sintetico.js <salida.json>
//   DATABASE_URL=<base temporal> node scripts/importarTramites.js <salida.json>
import { writeFileSync } from 'node:fs';

const MUNICIPIOS = ['Formosa', 'Clorinda', 'Pirané', 'El Colorado', 'Las Lomitas', 'Ingeniero Juárez', 'Ibarreta', 'Laguna Blanca'];
const REPETIDOS = [
  'Habilitación comercial', 'Licencia de conducir', 'Libre deuda municipal', 'Permiso de obra', 'Certificado de final de obra',
  'Tasa de alumbrado, barrido y limpieza', 'Patente automotor', 'Carnet de manipulador de alimentos', 'Poda de árboles en vía pública',
  'Reclamo por bache', 'Inscripción en el registro de proveedores', 'Permiso de uso de espacio público', 'Habilitación de taxi o remis',
  'Baja de comercio', 'Desratización y fumigación', 'Inscripción de feriante', 'Retiro de residuos voluminosos',
  'Plan de pago de deudas municipales', 'Certificado de zonificación', 'Habilitación de salón de eventos',
];
// Una ausencia a propósito: para probar que se avisa cuando la localidad pedida no lo tiene.
const AUSENTES = { 'Habilitación de taxi o remis': 'Laguna Blanca' };
const OBRAS = new Set(['Permiso de obra', 'Certificado de final de obra', 'Certificado de zonificación', 'Reclamo por bache']);

const municipalidad = (m) => (m === 'Formosa' ? 'Municipalidad de la Ciudad de Formosa' : `Municipalidad de ${m}`);
const SECRETARIA_GOBIERNO = 'Secretaría de Gobierno';
const SECRETARIA_OBRAS = 'Secretaría de Obras Públicas';
const PROVINCIAL = 'Dirección Provincial de Registros (sintético)';

const describir = (nombre, lugar) =>
  `El trámite "${nombre}" se realiza ante ${lugar}. La persona se presenta con su documento de identidad ` +
  `vigente en la mesa de entradas, de lunes a viernes. La solicitud se evalúa en diez a quince días hábiles ` +
  `y el estado se consulta con el número de expediente. Si falta documentación, el expediente queda en espera.`;

const sectores = [
  ...MUNICIPIOS.map((m) => ({ nombre: municipalidad(m), tipo: 'ORGANISMO', jurisdiccion: 'MUNICIPAL', localidad: m })),
  { nombre: SECRETARIA_GOBIERNO, tipo: 'DEPARTAMENTO', padre: municipalidad('Formosa') },
  { nombre: SECRETARIA_OBRAS, tipo: 'DEPARTAMENTO', padre: municipalidad('Formosa') },
  { nombre: PROVINCIAL, tipo: 'ORGANISMO', jurisdiccion: 'PROVINCIAL' },
];

const tramites = [];
let n = 0;
const agregar = (nombre, sector, lugar, sectorPadre) =>
  tramites.push({ nombre, descripcion: describir(nombre, lugar), sector, ...(sectorPadre && { sectorPadre }), fuenteUrl: `https://sintetico.invalid/tramite/${++n}` });

for (const m of MUNICIPIOS) {
  for (const nombre of REPETIDOS) {
    if (AUSENTES[nombre] === m) continue;
    if (m === 'Formosa') {
      agregar(nombre, OBRAS.has(nombre) ? SECRETARIA_OBRAS : SECRETARIA_GOBIERNO, 'la Municipalidad de la Ciudad de Formosa', municipalidad('Formosa'));
    } else {
      agregar(nombre, municipalidad(m), `la Municipalidad de ${m}`);
    }
  }
}
// El mismo nombre en la provincia y en un municipio: dos pares (jurisdicción, localidad) distintos.
agregar('Certificado de domicilio', PROVINCIAL, 'la Dirección Provincial de Registros');
agregar('Certificado de domicilio', SECRETARIA_GOBIERNO, 'la Municipalidad de la Ciudad de Formosa', municipalidad('Formosa'));
// Un trámite único.
agregar('Inscripción en el registro de apicultores', PROVINCIAL, 'la Dirección Provincial de Registros');

const salida = process.argv[2];
if (!salida) throw new Error('Falta la ruta del JSON de salida.');
writeFileSync(salida, JSON.stringify({ sectores, tramites }, null, 1));
console.log(`${sectores.length} sectores y ${tramites.length} trámites en ${salida}`);
