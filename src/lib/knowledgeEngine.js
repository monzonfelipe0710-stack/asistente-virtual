import { knowledgeBase } from "../data/mockKnowledge";
import { documents } from "../data/mockDocuments";
import { detectOffice } from "./chatMemory";

const OFFICE_PLACES = {
  "Recursos Humanos": {
    place: "Recursos Humanos, Formosa, Argentina",
    address: "José María Uriburu 670, Formosa",
    hours: "Lunes a viernes, 07:00 a 13:00",
  },
  Legajos: {
    place: "Departamento de Legajos, Formosa, Argentina",
    address: "Fotheringham 1360, Formosa",
    hours: "Lunes a viernes, 07:00 a 13:00",
  },
  "Mesa de Entradas": {
    place: "Mesa de Entradas, Formosa, Argentina",
    address: "Belgrano 878, Formosa",
    hours: "Lunes a viernes, 07:00 a 13:00",
  },
  Liquidaciones: {
    place: "Departamento de Liquidaciones, Formosa, Argentina",
    address: "Sarmiento 320, Formosa",
    hours: "Lunes a viernes, 07:00 a 13:00",
  },
};

const STOP_WORDS = new Set([
  "para",
  "como",
  "cual",
  "cuales",
  "cuando",
  "donde",
  "dnde",
  "que",
  "una",
  "uno",
  "unos",
  "unas",
  "con",
  "por",
  "los",
  "las",
  "tiene",
  "puedo",
  "puede",
  "pueden",
  "necesito",
  "necesita",
  "necesario",
  "poder",
  "saber",
  "tengo",
  "tiene",
  "tambien",
  "usted",
  "sobre",
  "mas",
  "informacion",
  "hacer",
  "hago",
  "solicitar",
  "solicit",
  "tramitar",
  "preciso",
  "dar",
  "dame",
  "me",
  "mi",
  "de",
  "del",
  "dela",
  "su",
  "se",
  "en",
  "al",
  "un",
  "es",
  "ese",
  "esta",
  "estas",
  "muchas",
  "muchos",
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Busca el artículo más relevante de la base de conocimiento para una consulta.
 * Devuelve { article, score } o null si no supera el umbral.
 */
export function scoreKnowledge(input) {
  const tokens = tokenize(input);
  if (tokens.length === 0) return null;

  let best = null;
  for (const article of knowledgeBase) {
    if (!article.active) continue;
    const q = new Set(tokenize(article.question));
    const a = new Set(tokenize(article.answer));
    const cat = new Set(tokenize(article.category));

    let score = 0;
    for (const tok of tokens) {
      if (q.has(tok)) score += 2;
      else if (a.has(tok)) score += 1;
      else if (cat.has(tok)) score += 0.5;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { article, score };
    }
  }
  return best;
}

/**
 * Relaciona una consulta con el documento oficial (formulario/guía) más afín.
 */
export function relateDocument(text) {
  const tokens = new Set(tokenize(text));
  if (tokens.size === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const doc of documents) {
    const dt = new Set(tokenize(`${doc.title} ${doc.description} ${doc.category}`));
    let s = 0;
    for (const tok of tokens) {
      if (dt.has(tok)) s += 1;
    }
    if (s > bestScore) {
      bestScore = s;
      best = doc;
    }
  }
  return bestScore >= 1 ? best : null;
}

/**
 * Detecta la oficina mencionada en un texto (por alias).
 */
export function officeFor(text) {
  return detectOffice(text);
}

/**
 * Devuelve la acción de tipo location para una oficina conocida.
 */
export function officeAction(name) {
  const info = OFFICE_PLACES[name];
  if (!info) return null;
  return {
    type: "location",
    label: `Buscar ${name} en Google Maps`,
    place: info.place,
    address: info.address,
    hours: info.hours,
  };
}

export function officeInfo(name) {
  return OFFICE_PLACES[name] ?? null;
}

function slugify(text) {
  return normalize(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Construye una acción de descarga con contenido legible a partir de un
 * documento de la base oficial y una respuesta (artículo o resumen).
 */
export function documentDownloadAction(doc, { question, answer, category, updatedAt }) {
  const content = [
    "CHATAP · ASISTENTE DE TRÁMITES",
    "====================================",
    `Tema: ${doc.title}`,
    category ? `Categoría: ${category}` : "",
    "------------------------------------",
    question ? `Consulta:\n${question}` : "",
    "------------------------------------",
    "Información:",
    String(answer || ""),
    updatedAt ? `\nActualizado: ${updatedAt}` : "",
    "",
    "Generado por ChatAP · Administración Pública",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    type: "download",
    label: `Descargar "${doc.title}" (${doc.format})`,
    fileName: `${slugify(doc.title)}.txt`,
    content,
  };
}