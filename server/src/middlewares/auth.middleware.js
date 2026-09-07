import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const autenticar = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error= new Error('No autorizado: falta el token.');
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

  // El token es una foto del momento del login: no sabe si después se suspendió
  // al usuario o le cambió el rol. Por eso el estado y el rol se releen de la
  // base en cada request, y una suspensión tiene efecto inmediato.
  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.id },
    select: { id: true, nombre: true, email: true, rol: true, estado: true },
  });

  if (!usuario || usuario.estado !== 'APROBADO') {
    const error = new Error('No autorizado: la cuenta no está activa.');
    error.statusCode = 401;
    throw error;
  }

  req.usuario = usuario;
  next();
};
