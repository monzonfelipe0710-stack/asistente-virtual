import { knowledgeBase } from "../data/mockKnowledge";
import { wizards } from "../data/wizard";

const RELATED_BY_TOPIC = {
  licencias: [
    {
      label: "¿Cuántos días tengo por enfermedad?",
      value: "¿Cuántos días de licencia por enfermedad tengo?",
    },
    {
      label: "¿Cómo gestiono un permiso por estudio?",
      value: "¿Cómo gestionar un permiso por estudio?",
    },
  ],
  recibos: [
    {
      label: "¿Qué descuentos aplican a mi haber?",
      value: "¿Cuáles son los descuentos aplicables a mi haber?",
    },
    {
      label: "¿Cómo pido un adelanto de haberes?",
      value: "¿Cómo solicitar un adelanto de haberes?",
    },
  ],
  expedientes: [
    {
      label: "¿Qué es el SIGED?",
      value: "¿Qué es el SIGED y cómo funciona?",
    },
    {
      label: "¿Cómo reporto un problema técnico?",
      value: "¿Cómo reportar un problema técnico con el sistema?",
    },
  ],
  tramites: [
    {
      label: "¿Cómo tramito el pase a otra repartición?",
      value: "¿Cómo tramitar el pase a otra repartición?",
    },
    {
      label: "¿Qué documentación llevo al jubilatorio?",
      value: "¿Qué documentación necesito para el jubilatorio?",
    },
  ],
  formularios: [
    {
      label: "¿Cómo solicito una licencia?",
      value: "¿Cómo solicito una licencia?",
    },
    {
      label: "¿Dónde veo mi recibo de sueldo?",
      value: "¿Dónde puedo ver mi recibo de sueldo?",
    },
  ],
  ubicaciones: [
    {
      label: "¿Cómo sigo mi expediente?",
      value: "¿Cómo puedo seguir mi expediente?",
    },
    {
      label: "¿Dónde veo mi recibo de sueldo?",
      value: "¿Dónde puedo ver mi recibo de sueldo?",
    },
  ],
  personas: [
    {
      label: "¿Dónde puedo hacer una consulta presencial?",
      value: "¿Dónde puedo hacer una consulta presencial?",
    },
  ],
};

const FOLLOWUP_POOL = [
  "¿Cómo puedo seguir mi expediente?",
  "¿Dónde puedo ver mi recibo de sueldo?",
  "¿Cómo solicito una licencia?",
];

const OFFICE_FOLLOWUP = /horario|atienden?|atiende|abre|cierra|hasta (que )?hora|donde (queda|atiende|llego)|dónde (queda|atiende|llego)|cómo llego|como llego|mapa|cómo ir|como ir|ubicación|ubicacion|en qué (dirección|direccion)|que direccion/i;

/**
 * Resuelve una pregunta de seguimiento del ciudadano sobre la última
 * oficina/contexto respondido. Devuelve { text, action } o null.
 */
export function resolveFollowUp(input, ctx) {
  if (!ctx?.officeData) return null;
  const info = ctx.officeData;
  if (!info || !info.hours) return null;

  const text = String(input || "");
  if (!OFFICE_FOLLOWUP.test(text)) return null;

  const action = {
    type: "location",
    label: `Buscar ${info.name} en Google Maps`,
    place: info.place,
    address: info.address,
    hours: info.hours,
  };
  return {
    text: `Esperá, te acerco esa info: ${info.name} atiende de ${info.hours}, en ${info.address}.`,
    action,
  };
}

/**
 * Detecta si la consulta dispara un asistente por pasos (wizard).
 */
export function wizardFor(text) {
  const t = String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("certificado")) {
    return { id: "certificado", label: wizards.certificado.title };
  }
  if (t.includes("expediente") || t.includes("siged") || t.includes("seguimi") || t.includes("seguimiento")) {
    return { id: "expediente", label: wizards.expediente.title };
  }
  if (t.includes("licencia") || t.includes("vacaciones") || t.includes("permiso")) {
    return { id: "licencia", label: wizards.licencia.title };
  }
  return null;
}

/**
 * Construye las sugerencias "También te puede servir" a partir del contexto
 * de la última respuesta. Devuelve una lista de { label, value }.
 */
export function buildRelated(ctx) {
  const out = [];
  const seen = new Set();
  const push = (opt) => {
    if (opt && opt.value && !seen.has(opt.value)) {
      seen.add(opt.value);
      out.push(opt);
    }
  };

  if (ctx?.kind === "knowledge" && ctx.category) {
    knowledgeBase
      .filter((k) => k.active && k.category === ctx.category && k.id !== ctx.articleId)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3)
      .forEach((k) => push({ label: k.question, value: k.question }));
  } else if (ctx?.kind === "intent" && ctx.topic) {
    (RELATED_BY_TOPIC[ctx.topic] || []).forEach(push);
  } else if (ctx?.kind === "memory") {
    (ctx.suggested || []).forEach((s) =>
      push({ label: s.label, value: s.query, description: s.description })
    );
  }

  const pool = [...FOLLOWUP_POOL];
  while (out.length < 2 && pool.length) {
    const q = pool.shift();
    push({ label: q, value: q });
  }
  return out.slice(0, 3);
}

/**
 * Chips de reencaminamiento para cuando el bot no entendió y no hay memoria.
 */
export function buildRecoverChips() {
  return FOLLOWUP_POOL.map((q) => ({ label: q, value: q }));
}