// Huella de lo que escribió el importador, por grupo de campos. Al reimportar, un grupo cuyo valor
// actual coincide con su huella no lo tocó nadie y se puede actualizar; si no coincide, alguien lo
// editó (desde el panel, con SQL o con otro script) y se conserva. Se guarda en
// `huella_importacion` como { grupo: hash }.
import crypto from 'node:crypto';

export const GRUPOS_TRAMITE = ['descripcion', 'costo', 'informacionAdicional', 'requisitos', 'mesas', 'documentos'];

const monto = (valor) => (valor === null || valor === undefined ? null : Number(valor).toFixed(2));
const texto = (valor) => valor ?? null;

// El valor de cada grupo en una forma estable: los mismos datos dan la misma huella aunque vengan
// de Prisma, de una consulta cruda o del JSON. Las listas van en el orden en que se guardan (por id).
const VALOR = {
  descripcion: (t) => texto(t.descripcion),
  costo: (t) => [monto(t.costo), texto(t.costoDetalle)],
  informacionAdicional: (t) => texto(t.informacionAdicional),
  requisitos: (t) => (t.requisitos ?? []).map((r) => [r.descripcion, texto(r.dondeSeConsigue), monto(r.costo)]),
  mesas: (t) => [...(t.mesaIds ?? (t.mesas ?? []).map((m) => m.mesaId ?? m.mesa?.id ?? m.id))].sort((a, b) => a - b),
  documentos: (t) => (t.documentos ?? []).map((d) => [d.nombre, texto(d.archivo), texto(d.urlExterna), texto(d.tipo)]),
};

const hash = (valor) => crypto.createHash('sha256').update(JSON.stringify(valor)).digest('hex').slice(0, 32);

export const huellaDeGrupo = (grupo, tramite) => hash(VALOR[grupo](tramite));

// El grupo está vacío: sin costo, sin requisitos, etc. Un grupo vacío y sin huella se puede llenar.
export const grupoVacio = (grupo, tramite) => {
  const v = VALOR[grupo](tramite);
  if (Array.isArray(v)) return grupo === 'costo' ? v.every((x) => x === null) : v.length === 0;
  return v === null || v === '';
};

export const huellaDeMesa = (mesa) =>
  hash([mesa.nombre, texto(mesa.direccion), texto(mesa.localidad), texto(mesa.horario), texto(mesa.telefono), texto(mesa.email)]);

// El costo que se muestra es el que cargó el importador desde el portal y nadie lo cambió.
export const costoDelPortal = (tramite) =>
  Boolean(tramite.verificadoEn) && tramite.huellaImportacion?.costo === huellaDeGrupo('costo', tramite);
