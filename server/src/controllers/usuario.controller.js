import * as usuarioService from '../services/usuario.service.js';
import { filtroUsuariosSchema, registroSchema } from '../validators/usuario.validator.js';

export const registrar = async (req, res) => {
  const datos = registroSchema.parse(req.body);

  const existente = await usuarioService.buscarPorEmail(datos.email);
  if (existente) {
    const error = new Error('Ya existe una cuenta registrada con esa dirección de correo electrónico.');
    error.statusCode = 409;
    throw error;
  }

  const usuario = await usuarioService.registrarSolicitud(datos);

  res.status(201).json({
    mensaje: 'Solicitud registrada. Queda pendiente de aprobación.',
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      estado: usuario.estado,
    },
  });
};

export const listar = async (req, res) => {
  const { estado } = filtroUsuariosSchema.parse(req.query);
  const usuarios = await usuarioService.listarUsuarios(estado);
  res.json(usuarios);
};

export const listarPendientes = async (req, res) => {
  const pendientes = await usuarioService.listarPendientes();
  res.json(pendientes);
};

export const aprobar = async (req, res) => {
  const id = Number(req.params.id);

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error('Usuario no existente.');
    error.statusCode = 404;
    throw error;
  }

  if (usuario.estado !== 'PENDIENTE') {
    const error = new Error('La solicitud ya fue procesada.');
    error.statusCode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, 'APROBADO');
  res.json({ mensaje: 'Administrador aprobado', usuario: actualizado});
};

export const rechazar = async (req, res) => {
  const id = Number(req.params.id);

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error('Usuario no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  if (usuario.estado !== 'PENDIENTE') {
    const error = new Error('La solicitud ya fue procesada.');
    error.statusCode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, 'RECHAZADO');
  res.json({ mensaje: 'Solicitud rechazada.', usuario: actualizado});
};
export const suspender = async (req, res) => {
  const id = Number(req.params.id);

  // Evita que un superusuario se deje afuera del sistema a sí mismo.
  if (id === req.usuario.id) {
    const error = new Error('No podés suspender tu propia cuenta.');
    error.statusCode = 409;
    throw error;
  }

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error('Usuario no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  if (usuario.estado !== 'APROBADO') {
    const error = new Error('Solo se puede suspender a un usuario aprobado.');
    error.statusCode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, 'SUSPENDIDO');
  res.json({ mensaje: 'Usuario suspendido.', usuario: actualizado });
};

export const reactivar = async (req, res) => {
  const id = Number(req.params.id);

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error('Usuario no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  if (usuario.estado !== 'SUSPENDIDO') {
    const error = new Error('Solo se puede reactivar a un usuario suspendido.');
    error.statusCode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, 'APROBADO');
  res.json({ mensaje: 'Usuario reactivado.', usuario: actualizado });
};
