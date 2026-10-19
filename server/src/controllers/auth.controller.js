import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import crypto from 'crypto';
import * as usuarioService from '../services/usuario.service.js';
import * as correoService from '../services/correo.service.js';
import { loginSchema, recuperarSchema, restablecerSchema } from '../validators/auth.validators.js';

const MENSAJES_ESTADO = {
  PENDIENTE: 'Tu solicitud todavía está pendiente de aprobación.',
  RECHAZADO: 'Tu solicitud de acceso fue rechazada.',
  SUSPENDIDO: 'Tu cuenta se encuentra suspendida. Contactá a un administrador.',
};

export const login = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // 1. Identidad: email existe + contraseña correcta (mensaje genérico a propósito)
  if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
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
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  });
};

export const solicitarRecuperacion = async (req, res) => {
  const { email } = recuperarSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (usuario && usuario.estado === 'APROBADO') {
    const tokenCrudo = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenCrudo).digest('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await usuarioService.guardarTokenRecuperacion(usuario.id, tokenHash, expira);

    const link = `${process.env.FRONTEND_URL}/restablecer?token=${tokenCrudo}`;
    correoService.enviarRecuperacion(usuario.email, usuario.nombre, link)
      .catch((err) => console.error('Error enviando mail de recuperación:', err.message));
  }

  res.json({ mensaje: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.' });
};

export const restablecer = async (req, res) => {
  const { token, password } = restablecerSchema.parse(req.body);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const usuario = await usuarioService.buscarPorTokenRecuperacion(tokenHash);

  if (!usuario) {
    const error = new Error('El enlace de recuperación es inválido o expiró. Pedí uno nuevo.');
    error.statusCode = 400;
    throw error;
  }

  await usuarioService.cambiarPassword(usuario.id, password);

  res.json({ mensaje: 'Tu contraseña fue actualizada. Ya podés iniciar sesión.' });
};