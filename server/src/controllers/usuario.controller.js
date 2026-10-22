import * as usuarioService from "../services/usuario.service.js";
import {
  filtroUsuariosSchema,
  registroSchema,
  asignarSectoresSchema,
  registroCiudadanoSchema,
  crearUsuarioSchema,
} from "../validators/usuario.validator.js";
import * as turnosService from "../services/turnos.service.js";

export const registrar = async (req, res) => {
  const datos = registroSchema.parse(req.body);

  const existente = await usuarioService.buscarPorEmail(datos.email);
  if (existente) {
    const error = new Error(
      "Ya existe una cuenta registrada con esa dirección de correo electrónico.",
    );
    error.statusCode = 409;
    throw error;
  }

  const usuario = await usuarioService.registrarSolicitud(datos);

  res.status(201).json({
    mensaje: "Solicitud registrada. Queda pendiente de aprobación.",
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
    const error = new Error("Usuario no existente.");
    error.statusCode = 404;
    throw error;
  }

  if (usuario.estado !== "PENDIENTE") {
    const error = new Error("La solicitud ya fue procesada.");
    error.statusCode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, "APROBADO");
  res.json({ mensaje: "Administrador aprobado", usuario: actualizado });
};

export const rechazar = async (req, res) => {
  const id = Number(req.params.id);

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }
  if (usuario.estado !== "PENDIENTE") {
    const error = new Error("La solicitud ya fue procesada.");
    error.statusCode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, "RECHAZADO");
  res.json({ mensaje: "Solicitud rechazada.", usuario: actualizado });
};
export const suspender = async (req, res) => {
  const id = Number(req.params.id);

  // Evita que un superusuario se deje afuera del sistema a sí mismo.
  if (id === req.usuario.id) {
    const error = new Error("No podés suspender tu propia cuenta.");
    error.statusCode = 409;
    throw error;
  }

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }
  if (usuario.estado !== "APROBADO") {
    const error = new Error("Solo se puede suspender a un usuario aprobado.");
    error.statusCode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, "SUSPENDIDO");
  res.json({ mensaje: "Usuario suspendido.", usuario: actualizado });
};

export const reactivar = async (req, res) => {
  const id = Number(req.params.id);

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }
  if (usuario.estado !== "SUSPENDIDO") {
    const error = new Error("Solo se puede reactivar a un usuario suspendido.");
    error.statusCode = 409;
    throw error;
  }

  const actualizado = await usuarioService.cambiarEstado(id, "APROBADO");
  res.json({ mensaje: "Usuario reactivado.", usuario: actualizado });
};

export const listarSectores = async (req, res) => {
  const id = Number(req.params.id);

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const sectores = await usuarioService.listarSectoresDeUsuario(id);
  res.json(sectores);
};

export const misSectores = async (req, res) => {
  const sectores = await usuarioService.listarSectoresDeUsuario(req.usuario.id);
  res.json(sectores);
};

export const asignarSectores = async (req, res) => {
  const id = Number(req.params.id);
  const { sectorIds } = asignarSectoresSchema.parse(req.body);

  const usuario = await usuarioService.obtenerPorId(id);
  if (!usuario) {
    const error = new Error("Usuario no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    const error = new Error(
      "Los sectores solo pueden ser asignados a adminstradores.",
    );
    error.statusCode = 409;
    throw error;
  }

  const idsUnicos = [...new Set(sectorIds)];
  const existentes = await usuarioService.contarSectoresExistentes(idsUnicos);
  if (existentes !== idsUnicos.length) {
    const error = new Error("Uno o más sectores no existen.");
    error.statusCode = 400;
    throw error;
  }

  const sectores = await usuarioService.asignarSectores(id, idsUnicos);
  res.json({ mensaje: "Sectores actualizados.", sectores });
};

export const registrarCiudadano = async (req, res) => {
  const datos = registroCiudadanoSchema.parse(req.body);

  if (await usuarioService.buscarPorEmail(datos.email)) {
    const error = new Error("Ya existe una cuenta registrada con ese correo.");
    error.statusCode = 409;
    throw error;
  }

  if (await usuarioService.buscarPorDni(datos.dni, datos.genero)) {
    const error = new Error("Ya existe una cuenta registrada con ese DNI.");
    error.statusCode = 409;
    throw error;
  }

  let persona;
  try {
    persona = await turnosService.buscarPersona(datos.dni, datos.genero);
  } catch {
    const error = new Error(
      "No pudimos verificar tu identidad ahora mismo porque el servicio de padrón no está disponible. Probá de nuevo en unos minutos.",
    );
    error.statusCode = 503;
    throw error;
  }

  if (!persona) {
    const error = new Error(
      "No pudimos verificar tus datos en el padrón. Revisá el DNI y el sexo.",
    );
    error.statusCode = 422;
    throw error;
  }

  const usuario = await usuarioService.registrarCiudadano({
    ...datos,
    nombre: persona.nombreCompleto,
  });

  res.status(201).json({
    mensaje: "Cuenta de ciudadano creada. Ya podés iniciar sesión.",
    usuario,
  });
};


export const crearUsuarioAdministrativo = async (req, res) => {
  const datos = crearUsuarioSchema.parse(req.body);

  if (await usuarioService.buscarPorEmail(datos.email)) {
    const error = new Error('Ya existe una cuenta registrada con ese correo.');
    error.statusCode = 409;
    throw error;
  }

  if (datos.dni && await usuarioService.buscarPorDniCualquiera(datos.dni)) {
    const error = new Error('Ya existe una cuenta registrada con ese DNI.');
    error.statusCode = 409;
    throw error;
  }

  if (datos.cuil && await usuarioService.buscarPorCuil(datos.cuil)) {
    const error = new Error('Ya existe una cuenta registrada con ese CUIL.');
    error.statusCode = 409;
    throw error;
  }

  const sectorIds = datos.rol === 'ADMINISTRADOR'
    ? [...new Set(datos.sectorIds)]
    : [];
  const sectoresExistentes = await usuarioService.contarSectoresExistentes(sectorIds);
  if (sectoresExistentes !== sectorIds.length) {
    const error = new Error('Uno o más sectores seleccionados no existen.');
    error.statusCode = 400;
    throw error;
  }

  const usuario = await usuarioService.crearUsuarioAdministrado({
    ...datos,
    sectorIds,
  });

  res.status(201).json({
    mensaje: 'Cuenta creada correctamente.',
    usuario,
  });
};
