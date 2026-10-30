import * as usuarioService from "../services/usuario.service.js";
import {
  filtroUsuariosSchema,
  crearEmpleadoSchema,
  asignarSectoresSchema,
  registroCiudadanoSchema,
  GENEROS_PADRON,
} from "../validators/usuario.validator.js";
import * as turnosService from "../services/turnos.service.js";
import { coincideConPadron } from "../utils/nombres.js";

// Con M o F se consulta el padrón con ese sexo. Con X el padrón no tiene contra qué
// cruzarlo: se prueba con M y con F, y la persona tiene que coincidir con el nombre
// y apellido tipeados para no registrar a alguien con un DNI ajeno.
const buscarEnPadron = async (datos) => {
  if (datos.genero !== "X") return turnosService.buscarPersona(datos.dni, datos.genero);

  for (const sexo of GENEROS_PADRON) {
    const persona = await turnosService.buscarPersona(datos.dni, sexo);
    if (persona && coincideConPadron(datos, persona)) return persona;
  }
  return null;
};

export const listar = async (req, res) => {
  const { estado } = filtroUsuariosSchema.parse(req.query);
  const usuarios = await usuarioService.listarUsuarios(estado);
  res.json(usuarios);
};

export const crearEmpleado = async (req, res) => {
  const datos = crearEmpleadoSchema.parse(req.body);

  if (await usuarioService.buscarPorEmail(datos.email)) {
    const error = new Error('Ya existe una cuenta registrada con ese correo.');
    error.statusCode = 409;
    throw error;
  }

  const idsUnicos = [...new Set(datos.sectorIds)];
  if (idsUnicos.length > 0) {
    const existentes = await usuarioService.contarSectoresExistentes(idsUnicos);
    if (existentes !== idsUnicos.length) {
      const error = new Error('Uno o más sectores no existen.');
      error.statusCode = 400;
      throw error;
    }
  }

  const usuario = await usuarioService.crearEmpleado({ ...datos, sectorIds: idsUnicos });

  res.status(201).json({
    mensaje: 'Empleado creado. Pasale las credenciales; en el primer ingreso deberá cambiar la contraseña.',
    usuario,
  });
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
      "Los sectores solo pueden ser asignados a administradores.",
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

  if (await usuarioService.buscarPorDni(datos.dni)) {
    const error = new Error("Ya existe una cuenta registrada con ese DNI.");
    error.statusCode = 409;
    throw error;
  }

  let persona;
  try {
    persona = await buscarEnPadron(datos);
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

  // Se guarda el nombre del padrón, no el tipeado.
  const usuario = await usuarioService.registrarCiudadano({
    dni: datos.dni,
    genero: datos.genero,
    email: datos.email,
    password: datos.password,
    nombre: persona.nombreCompleto,
  });

  res.status(201).json({
    mensaje: "Cuenta de ciudadano creada. Ya podés iniciar sesión.",
    usuario,
  });
};
