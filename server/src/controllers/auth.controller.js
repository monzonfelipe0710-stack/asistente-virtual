import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import { loginSchema } from '../validators/auth.validators.js';

const MENSAJES_ESTADO = {
  PENDIENTE: 'Tu solicitud todavía está pendiente de aprobación.',
  RECHAZADO: 'Tu solicitud de acceso fue rechazada.',
  SUSPENDIDO: 'Tu cuenta se encuentra suspendida. Contactá a un administrador.',
};

export const login = async (req, res) => {
  const { email, dni, password } = loginSchema.parse(req.body);

  const candidatos = email
    ? [await prisma.usuario.findUnique({ where: { email } })].filter(Boolean)
    : await prisma.usuario.findMany({
        where: { dni },
        orderBy: { id: 'asc' },
      });

  let usuario = null;
  for (const candidato of candidatos) {
    if (await bcrypt.compare(password, candidato.passwordHash)) {
      usuario = candidato;
      break;
    }
  }

  // Mensaje genérico para no revelar si existe el email o DNI.
  if (!usuario) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  // 2. Recién con identidad confirmada, informamos el estado
  if (usuario.estado !== 'APROBADO') {
    const error = new Error(MENSAJES_ESTADO[usuario.estado] || 'Tu cuenta no está habilitada.');
    error.statusCode = 403;
    throw error;
  }

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      dni: usuario.dni,
      genero: usuario.genero,
    },
  });
};