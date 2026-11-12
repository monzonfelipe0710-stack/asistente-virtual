import rateLimit from 'express-rate-limit';

// Protege el login contra fuerza bruta.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo en unos minutos.' },
});

// Evita el spam de solicitudes de registro pendientes de aprobación.
export const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de registro. Probá de nuevo más tarde.' },
});

// Evita el spam de correos de recuperación.
export const recuperarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos de recuperación. Esperá unos minutos e intentá de nuevo.' },
});

// Rutas públicas de solo lectura: frena el scraping sin molestar a un uso normal.
export const publicoLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Esperá un momento e intentá de nuevo.' },
});

// Protege el restablecimiento contra la prueba masiva de tokens.
// Contador propio: no comparte intentos con el login.
export const restablecerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de restablecimiento. Probá de nuevo en unos minutos.' },
});