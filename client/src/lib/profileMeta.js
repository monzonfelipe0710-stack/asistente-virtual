/**
 * Utilidades para manejo y persistencia de nombre, apellido y metadatos del perfil.
 */

const PROFILE_META_PREFIX = "chatap.profile_meta.";

/** Divide un nombre completo en nombre y apellido de forma limpia. */
export function splitFullName(fullName = "") {
  const clean = String(fullName || "").trim();
  if (!clean) return { firstName: "", lastName: "" };

  // Formato con coma: "GÓMEZ, ALEX"
  if (clean.includes(",")) {
    const [last, first] = clean.split(",").map((s) => s.trim());
    return { firstName: first || "", lastName: last || "" };
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };

  // 3 o más partes: p. ej. "Juan Carlos Gómez" -> first: "Juan Carlos", last: "Gómez"
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, parts.length - 1).join(" ");
  return { firstName, lastName };
}

/** Calcula las iniciales en mayúsculas a partir del nombre y apellido o nombre completo. */
export function getInitials(firstName = "", lastName = "", fallback = "") {
  const f = String(firstName || "").trim();
  const l = String(lastName || "").trim();
  if (f && l) {
    return (f[0] + l[0]).toUpperCase();
  }
  if (f) {
    const parts = f.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return f.slice(0, 2).toUpperCase();
  }
  const cleanFallback = String(fallback || "").trim();
  if (cleanFallback) {
    const parts = cleanFallback.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleanFallback.slice(0, 2).toUpperCase();
  }
  return "?";
}

/** Guarda los datos personalizados del perfil (nombre, apellido, teléfono, etc.) en localStorage. */
export function saveCustomProfileMeta(userId, dni, meta = {}) {
  try {
    const payload = JSON.stringify(meta);
    if (userId) {
      window.localStorage.setItem(`${PROFILE_META_PREFIX}id_${userId}`, payload);
    }
    if (dni) {
      window.localStorage.setItem(`${PROFILE_META_PREFIX}dni_${dni}`, payload);
    }
  } catch {
    /* quota o storage no disponible */
  }
}

/** Carga los datos personalizados del perfil a partir de userId o DNI. */
export function loadCustomProfileMeta(userId, dni) {
  try {
    if (userId) {
      const raw = window.localStorage.getItem(`${PROFILE_META_PREFIX}id_${userId}`);
      if (raw) return JSON.parse(raw);
    }
    if (dni) {
      const raw = window.localStorage.getItem(`${PROFILE_META_PREFIX}dni_${dni}`);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    /* storage no disponible */
  }
  return null;
}
