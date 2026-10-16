// Lectura por voz (Text To Speech) usando la Web Speech API.
// Pensado para el "Modo lector de pantalla": permite que las personas ciegas
// escuchen las respuestas sin depender de un lector externo.
//
// Detalles de robustez:
// - Trocea el texto en oraciones cortas: varios motores (Chrome) cortan las
//   locuciones largas (~15 s), así que leemos por partes encadenadas.
// - Expone el estado "hablando" para mostrar/ocultar el control de detener.

const MAX_CHUNK = 180;

let cachedVoices = [];
let rate = 1;
let speaking = false;
const listeners = new Set();

function emit() {
  for (const fn of listeners) {
    try {
      fn(speaking);
    } catch {
      // un oyente roto no debe romper la lectura
    }
  }
}

function setSpeaking(next) {
  if (speaking === next) return;
  speaking = next;
  emit();
}

export function onSpeakingChange(callback) {
  if (typeof callback !== "function") return () => {};
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function isSpeaking() {
  return speaking;
}

export function setRate(value) {
  const n = Number(value);
  rate = Number.isFinite(n) && n > 0 ? n : 1;
}

export function getRate() {
  return rate;
}

export function canSpeak() {
  if (typeof window === "undefined") return false;
  try {
    return "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  } catch {
    return false;
  }
}

function refreshVoices() {
  if (!canSpeak()) return;
  try {
    const list = window.speechSynthesis.getVoices() || [];
    if (list.length) cachedVoices = list;
  } catch {
    /* sin voces disponibles */
  }
}

if (canSpeak()) {
  refreshVoices();
  try {
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
  } catch {
    /* algunos motores usan onvoiceschanged */
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
}

function pickSpanishVoice() {
  if (!cachedVoices.length) refreshVoices();
  const voices = cachedVoices;
  return (
    voices.find((v) => /es[-_]?AR/i.test(v.lang || "")) ||
    voices.find((v) => /es[-_]?419/i.test(v.lang || "")) ||
    voices.find((v) => (v.lang || "").toLowerCase().startsWith("es")) ||
    null
  );
}

// Divide el texto en fragmentos legibles sin cortar palabras.
function chunk(text) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?;:]+[.!?;:]*/g) || [clean];
  const out = [];
  let buffer = "";
  const flush = () => {
    if (buffer) {
      out.push(buffer);
      buffer = "";
    }
  };
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (sentence.length > MAX_CHUNK) {
      flush();
      for (let i = 0; i < sentence.length; i += MAX_CHUNK) {
        out.push(sentence.slice(i, i + MAX_CHUNK));
      }
      continue;
    }
    if ((buffer ? buffer + " " : "") + sentence.length <= MAX_CHUNK) {
      buffer = buffer ? buffer + " " + sentence : sentence;
    } else {
      flush();
      buffer = sentence;
    }
  }
  flush();
  return out;
}

export function speak(text) {
  if (!canSpeak()) return false;
  const clean = String(text || "").trim();
  if (!clean) return false;
  try {
    window.speechSynthesis.cancel();
    const pieces = chunk(clean);
    if (!pieces.length) return false;
    const voice = pickSpanishVoice();
    pieces.forEach((piece, index) => {
      const utterance = new window.SpeechSynthesisUtterance(piece);
      utterance.lang = "es-AR";
      utterance.rate = rate;
      utterance.pitch = 1;
      if (voice) utterance.voice = voice;
      if (index === 0) utterance.onstart = () => setSpeaking(true);
      if (index === pieces.length - 1) {
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
      }
      window.speechSynthesis.speak(utterance);
    });
    return true;
  } catch {
    setSpeaking(false);
    return false;
  }
}

export function stopSpeaking() {
  setSpeaking(false);
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // sin soporte: no hacemos nada
  }
}
