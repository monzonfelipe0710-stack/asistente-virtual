import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

// Carga y valida el usuario del token (JWT + estado + invalidación por cambio de contraseña).
// NO chequea debeCambiarPassword: eso lo decide cada middleware.
const cargarUsuarioDesdeToken = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('No autorizado: falta el token.');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    const error = new Error('No autorizado: token inválido o expirado.');
    error.statusCode = 401;
    throw error;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.id },
    select: {
      id: true, nombre: true, email: true, rol: true, estado: true,
      debeCambiarPassword: true, passwordCambiadaEn: true,
    },
  });

  if (!usuario || usuario.estado !== 'APROBADO') {
    const error = new Error('No autorizado: la cuenta no está activa.');
    error.statusCode = 401;
    throw error;
  }

  // Invalida tokens de antes del último cambio de contraseña (#4 B.7).
  // Comparación exacta del claim pwd contra el valor actual: no depende de la precisión del tiempo.
  const pwdActual = usuario.passwordCambiadaEn?.getTime() ?? 0;
  if ((payload.pwd ?? 0) !== pwdActual) {
    const error = new Error('Tu sesión expiró porque se cambió la contraseña. Iniciá sesión de nuevo.');
    error.statusCode = 401;
    throw error;
  }

  return usuario;
};

export const autenticar = async (req, res, next) => {
  const usuario = await cargarUsuarioDesdeToken(req);

  if (usuario.debeCambiarPassword) {
    const error = new Error('Debés cambiar tu contraseña antes de continuar.');
    error.statusCode = 403;
    error.codigo = 'PASSWORD_CHANGE_REQUIRED';
    throw error;
  }

  req.usuario = usuario;
  next();
};

export const autenticarCambioPassword = async (req, res, next) => {
  req.usuario = await cargarUsuarioDesdeToken(req);
  next();
};

export const autenticarOpcional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next();
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.id },
    select: { id: true, nombre: true, email: true, rol: true, estado: true },
  });

  if (usuario && usuario.estado === 'APROBADO') {
    req.usuario = usuario;
  }

  next();
};