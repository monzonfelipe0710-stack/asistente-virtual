import * as usuarioService from '../services/usuario.service.js';
import { registroSchema } from '../validators/usuario.validator.js';

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

export const listarPendientes = async (req, res) => {
  const pendientes = await usuarioService.listarPendientes();
  res.json(pendientes);
};

export const aprobar = async (req, res) => {
  const id = Number(req.params.id);

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error('La solicitud ya fue procesada.');
    error.statuscode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, 'APROBADO');
  res.json({ mensaje: 'Administrador aprobado', usuario: actualizado});
};