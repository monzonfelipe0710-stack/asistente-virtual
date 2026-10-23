import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import crypto from 'crypto';
import * as usuarioService from '../services/usuario.service.js';
import * as correoService from '../services/correo.service.js';
import { loginSchema, recuperarSchema, restablecerSchema, cambiarPasswordSchema } from '../validators/auth.validators.js';

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
    { id: usuario.id, rol: usuario.rol, pwd: usuario.passwordCambiadaEn?.getTime() ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );

    res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, debeCambiarPassword: usuario.debeCambiarPassword },
  });
};

export const solicitarRecuperacion = async (req, res) => {
  const { email } = recuperarSchema.parse(req.body);

  // Respondemos ya, igual exista o no el email (anti-enumeración + anti-timing).
  res.json({ mensaje: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.' });

  // El trabajo real va en segundo plano; el try/catch evita que un error intente responder de nuevo.
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || usuario.estado !== 'APROBADO') return;

    const tokenCrudo = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenCrudo).digest('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await usuarioService.guardarTokenRecuperacion(usuario.id, tokenHash, expira);

    const link = `${process.env.FRONTEND_URL}/restablecer?token=${tokenCrudo}`;
    await correoService.enviarRecuperacion(usuario.email, usuario.nombre, link);
  } catch (err) {
    console.error('Error en recuperación de contraseña:', err.message);
  }
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

export const cambiarPassword = async (req, res) => {
  const { passwordActual, passwordNueva } = cambiarPasswordSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
  if (!usuario || !(await bcrypt.compare(passwordActual, usuario.passwordHash))) {
    const error = new Error('La contraseña actual es incorrecta.');
    error.statusCode = 400;
    throw error;
  }

  const actualizado = await usuarioService.cambiarPassword(usuario.id, passwordNueva);

  // Token nuevo con el pwd actualizado: el anterior queda invalidado.
  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol, pwd: actualizado.passwordCambiadaEn?.getTime() ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );

  res.json({
    mensaje: 'Contraseña actualizada.',
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, debeCambiarPassword: false },
  });
};