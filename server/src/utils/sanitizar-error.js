// Un error de Prisma trae en el mensaje (y a veces en el stack) el host de la base, para quien
// diagnostica la conexión; eso no tiene que llegar a un log. Lo mismo si por error se imprimiera
// la DATABASE_URL completa, con usuario y contraseña. Se usa en los catch-all que loguean el error
// entero, no en los que ya loguean solo un código (reintento-base.js).
const partesSensibles = () => {
  const partes = [];
  for (const url of [process.env.DATABASE_URL, process.env.DATABASE_URL_TEST]) {
    if (!url) continue;
    partes.push(url);
    try {
      const { hostname, username, password } = new URL(url);
      if (hostname) partes.push(hostname);
      if (username) partes.push(username);
      if (password) partes.push(password);
    } catch {
      // No es una URL válida: no hay host ni usuario para sacar aparte, pero la cadena entera ya está.
    }
  }
  // Las más largas primero: una cadena completa no deja un resto parcial de sí misma (el host
  // dentro de la URL, el usuario dentro del host).
  return [...new Set(partes)].filter((p) => p.length > 3).sort((a, b) => b.length - a.length);
};

const reemplazar = (texto, sensibles) => {
  if (!texto) return texto;
  let limpio = texto;
  for (const parte of sensibles) limpio = limpio.split(parte).join('<datos de conexión>');
  return limpio;
};

// Devuelve el mismo error si no tiene nada sensible, o uno nuevo con el mismo nombre y código pero
// sin la cadena de conexión en el mensaje ni en el stack.
export const sanitizarError = (err) => {
  if (!(err instanceof Error)) return err;
  const sensibles = partesSensibles();
  if (sensibles.length === 0) return err;
  const mensaje = reemplazar(err.message, sensibles);
  const stack = reemplazar(err.stack, sensibles);
  if (mensaje === err.message && stack === err.stack) return err;
  const limpio = new Error(mensaje);
  limpio.name = err.name;
  limpio.code = err.code;
  limpio.stack = stack;
  return limpio;
};
