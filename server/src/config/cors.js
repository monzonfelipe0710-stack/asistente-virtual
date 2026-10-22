const ORIGENES_LOCALES = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

export const crearOpcionesCors = (env = process.env) => {
  const configurados = String(
    env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:5173',
  )
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

  const origenesPermitidos = new Set([
    ...configurados,
    ...(env.NODE_ENV === 'production' ? [] : ORIGENES_LOCALES),
  ]);

  return {
    origin(origen, callback) {
      if (!origen || origenesPermitidos.has(origen)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
};
