import { readJSON, writeJSON } from "./auth";

const MEMORY_PREFIX = "chatap.memory.";

const TOPICS = {
  licencias: {
    label: "licencias",
    keywords: ["licencia", "vacaciones", "permiso"],
  },
  recibos: {
    label: "recibos de sueldo",
    keywords: ["recibo", "sueldo", "haberes", "miportal", "mi portal"],
  },
  expedientes: {
    label: "expedientes",
    keywords: ["expediente", "siged", "seguimiento de trámite", "seguimiento de tramite", "estado de mi trámite", "estado de mi tramite"],
  },
  rrhh: {
    label: "Recursos Humanos",
    keywords: ["recursos humanos", "rrhh", "rr.hh", "rr hh"],
  },
  legajos: {
    label: "legajos",
    keywords: ["legajo", "legajos"],
  },
  tramites: {
    label: "trámites y documentación",
    keywords: ["trámite", "tramite", "documentación", "documentacion", "requisito", "guía", "guia", "pasos"],
  },
  formularios: {
    label: "formularios y plantillas",
    keywords: ["formulario", "plantilla", "descarga", "formato"],
  },
  ubicaciones: {
    label: "oficinas y ubicaciones",
    keywords: ["ubicación", "ubicacion", "dirección", "direccion", "dónde", "donde", "mapa", "horario", "oficina", "presencial", "atención", "atencion"],
  },
  personas: {
    label: "atención personal",
    keywords: ["operador", "asesor", "persona", "atención humana", "atencion humana", "recepcionista"],
  },
};

export const OFFICES = [
  { name: "Recursos Humanos", aliases: ["recursos humanos", "rrhh", "rr.hh", "rr hh"] },
  { name: "Legajos", aliases: ["legajos", "legajo"] },
  { name: "Mesa de Entradas", aliases: ["mesa de entradas", "mesa de entrada", "mesas de entrada"] },
  { name: "Liquidaciones", aliases: ["liquidad", "liquidaciones"] },
];

const SUGGESTED = {
  licencias: {
    label: "Retomar licencias",
    query: "¿Cómo solicito una licencia?",
    description: "Continuá donde lo dejaste",
    icon: "M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  },
  recibos: {
    label: "Retomar recibos",
    query: "¿Dónde puedo ver mi recibo de sueldo?",
    description: "Volvé a consultar tus haberes",
    icon: "M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2zm3 5h6m-6 4h6m-6 4h3",
  },
  expedientes: {
    label: "Retomar expediente",
    query: "¿Cómo puedo seguir mi expediente?",
    description: "Seguí el estado de tu trámite",
    icon: "M9 12h6m-6 4h4m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  rrhh: {
    label: "Recursos Humanos",
    query: "¿Dónde atiende Recursos Humanos?",
    description: "Oficina y horarios",
    icon: "M12 21s7-5.5 7-12a7 7 0 10-14 0c0 6.5 7 12 7 12zm0-9a3 3 0 100-6 3 3 0 000 6z",
  },
  legajos: {
    label: "Legajos",
    query: "¿Dónde atiende Legajos?",
    description: "Oficina y horarios",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  tramites: {
    label: "Retomar trámites",
    query: "¿Qué documentación necesito para un trámite?",
    description: "Requisitos y guías",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a1 1 0 001 1h4a1 1 0 001-1M9 5a1 1 0 000-1h6a1 1 0 010 1",
  },
  formularios: {
    label: "Retomar formularios",
    query: "¿Podés darme un formulario para descargar?",
    description: "Plantillas y descargas",
    icon: "M15.172 7l-6.586 6.586a2 2 0 000 2.828l6.586 6.586a2 2 0 002.828 0l6.586-6.586a2 2 0 000-2.828l-6.586-6.586a2 2 0 00-2.828 0z",
  },
  ubicaciones: {
    label: "Oficinas y horarios",
    query: "¿Dónde puedo hacer una consulta presencial?",
    description: "Ubicaciones y atención",
    icon: "M12 21s7-5.5 7-12a7 7 0 10-14 0c0 6.5 7 12 7 12zm0-9a3 3 0 100-6 3 3 0 000 6z",
  },
};

function emptyMemory() {
  return {
    topics: {},
    offices: {},
    lastTopic: null,
    preferredOffice: null,
    lastAnswer: null,
    count: 0,
    lastAt: null,
    messages: [],
  };
}

export function memoryKey(userId) {
  return MEMORY_PREFIX + userId;
}

export function loadMemory(userId) {
  if (!userId) return null;
  const mem = readJSON(memoryKey(userId), null);
  return mem && typeof mem === "object" ? { ...emptyMemory(), ...mem } : emptyMemory();
}

export function saveMemory(userId, mem) {
  if (!userId) return;
  writeJSON(memoryKey(userId), mem);
}

export function detectTopic(text) {
  const t = String(text || "").toLowerCase();
  for (const [id, cfg] of Object.entries(TOPICS)) {
    if (cfg.keywords.some((k) => t.includes(k))) return id;
  }
  return null;
}

export function detectOffice(text) {
  const t = String(text || "").toLowerCase();
  const hit = OFFICES.find((o) => o.aliases.some((a) => t.includes(a)));
  return hit?.name ?? null;
}

export function rememberMessage(userId, text) {
  if (!userId || !text) return;
  const mem = loadMemory(userId);
  const topic = detectTopic(text);
  const office = detectOffice(text);
  if (topic) {
    mem.topics[topic] = (mem.topics[topic] || 0) + 1;
    mem.lastTopic = topic;
  }
  if (office) {
    mem.offices[office] = (mem.offices[office] || 0) + 1;
    mem.preferredOffice = office;
  }
  mem.count = (mem.count || 0) + 1;
  mem.lastAt = new Date().toISOString();
  mem.messages = [...(mem.messages || []), { text, at: mem.lastAt }].slice(-8);
  saveMemory(userId, mem);
  return mem;
}

export function topicLabel(topic) {
  return TOPICS[topic]?.label ?? null;
}

// Guarda qué respondió el bot a este usuario, para poder retomar el
// contexto en la próxima consulta (sesión nueva o conversación siguiente).
export function rememberAnswer(userId, meta) {
  if (!userId || !meta) return;
  const mem = loadMemory(userId);
  mem.lastAnswer = {
    label: meta.label || null,
    topic: meta.topic || null,
    category: meta.category || null,
    kind: meta.kind || "intent",
    watchedAt: new Date().toISOString(),
  };
  if (meta.topic) mem.lastTopic = meta.topic;
  saveMemory(userId, mem);
  return mem;
}

export function buildReminder(mem, userName) {
  if (!mem || !mem.count) return null;
  const opening = userName ? `${userName.split(" ")[0]}, ` : "";
  if (mem.lastTopic) {
    return `${opening}te recuerdo que la última vez estabas consultando sobre ${topicLabel(mem.lastTopic)}.`;
  }
  if (mem.preferredOffice) {
    return `${opening}la última vez hablamos de ${mem.preferredOffice}.`;
  }
  return null;
}

export function suggestedTopics(mem) {
  if (!mem || !mem.count) return [];
  const ranked = Object.entries(mem.topics)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  const out = [];
  for (const id of ranked) {
    if (SUGGESTED[id]) out.push(SUGGESTED[id]);
    if (out.length >= 2) break;
  }
  return out;
}