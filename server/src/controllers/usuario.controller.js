import * as usuarioService from '../services/usuario.service.js';
import { registroSchema } from '../validators/usuario.validator.js';

export const registrar = async (req, res) => {
  const datos = registroSchema.parse(req.body);

  const existence = await usuarioService.buscarPorEmail(datos.email);
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