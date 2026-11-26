import Constants from "expo-constants";
import { Platform } from "react-native";

const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:3000/api`;

const TIMEOUT_MS = 60000;

let token: string | null = null;
let alExpirarSesion: (() => void) | null = null;

export function fijarToken(nuevo: string | null) {
  token = nuevo;
}

export function alVencerSesion(callback: (() => void) | null) {
  alExpirarSesion = callback;
}

interface OpcionesDePedido {
  metodo?: string;
  cuerpo?: unknown;
  senal?: AbortSignal;
}

export function mensajeDeError(error: unknown, mensajePorDefecto: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return mensajePorDefecto;
}

function armarEncabezados(cuerpo: unknown): Record<string, string> {
  const headers: Record<string, string> = {};
  const esArchivo = cuerpo instanceof FormData;
  if (cuerpo !== undefined && !esArchivo) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function armarCuerpo(cuerpo: unknown): FormData | string | undefined {
  if (cuerpo === undefined) {
    return undefined;
  }
  if (cuerpo instanceof FormData) {
    return cuerpo;
  }
  return JSON.stringify(cuerpo);
}

async function enviarPedido(
  ruta: string,
  metodo: string,
  headers: Record<string, string>,
  cuerpo: unknown,
  senalInterna: AbortSignal
): Promise<Response> {
  try {
    return await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: armarCuerpo(cuerpo),
      signal: senalInterna,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Probá de nuevo en un momento.");
  }
}

async function leerRespuesta<T>(res: Response, conSesion: boolean): Promise<T> {
  let datos: { error?: string } | null = null;
  try {
    datos = await res.json();
  } catch {
    datos = null;
  }
  if (res.status === 401 && conSesion) alExpirarSesion?.();
  if (!res.ok) throw new Error(datos?.error ?? "El servidor no pudo completar la operación.");
  return datos as T;
}

async function pedir<T>(
  ruta: string,
  { metodo = "GET", cuerpo, senal }: OpcionesDePedido = {}
): Promise<T> {
  const controlador = new AbortController();
  senal?.addEventListener("abort", () => controlador.abort());
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  const conSesion = token !== null;

  const headers = armarEncabezados(cuerpo);

  let res: Response;
  try {
    res = await enviarPedido(ruta, metodo, headers, cuerpo, controlador.signal);
  } finally {
    clearTimeout(temporizador);
  }

  return leerRespuesta<T>(res, conSesion);
}

export interface MensajeChat {
  rol: "usuario" | "asistente";
  texto: string;
  tipo?: "respuesta" | "aclaracion";
}

// consultaId y calificarToken son null en las aclaraciones y en los mensajes conversacionales
// (saludos, gracias): esas respuestas no se pueden calificar.
interface RespuestaChat {
  tipo: "respuesta" | "aclaracion";
  respuesta: string;
  tramitesEncontrados: { id: number; nombre: string }[];
  opciones: { id: number; nombre: string }[];
  encontrado: boolean;
  consultaId?: number | null;
  calificarToken?: string | null;
}

export function consultarChat(mensajes: MensajeChat[], senal?: AbortSignal) {
  return pedir<RespuestaChat>("/chat", { metodo: "POST", cuerpo: { mensajes }, senal });
}

// Una sola vez por consulta: si ya se calificó, el server responde 409. El token sirve sin sesión.
export function calificarConsulta(
  consultaId: number,
  calificacion: 0 | 1,
  { motivo, token }: { motivo?: string; token?: string | null } = {}
) {
  return pedir<{ consultaId: number; calificacion: 0 | 1 }>(`/consultas/${consultaId}/calificar`, {
    metodo: "PATCH",
    cuerpo: { calificacion, motivo: motivo || null, token: token ?? undefined },
  });
}

type RolApi = "SUPERUSUARIO" | "ADMINISTRADOR" | "CIUDADANO";
export type EstadoApi = "PENDIENTE" | "APROBADO" | "RECHAZADO" | "SUSPENDIDO";

export interface UsuarioApi {
  id: number;
  nombre: string;
  email: string;
  rol: RolApi;
  estado?: EstadoApi;
  createdAt?: string;
  debeCambiarPassword?: boolean;
}

export function iniciarSesion(email: string, password: string) {
  return pedir<{ token: string; usuario: UsuarioApi }>("/auth/login", {
    metodo: "POST",
    cuerpo: { email, password },
  });
}

export function solicitarRecuperacion(email: string) {
  return pedir<{ mensaje: string }>("/auth/recuperar", { metodo: "POST", cuerpo: { email } });
}

export function restablecerPassword(token: string, password: string) {
  return pedir<{ mensaje: string }>("/auth/restablecer", {
    metodo: "POST",
    cuerpo: { token, password },
  });
}

export function cambiarPassword(passwordActual: string, passwordNueva: string) {
  return pedir<{ mensaje: string; token: string; usuario: UsuarioApi }>("/auth/cambiar-password", {
    metodo: "POST",
    cuerpo: { passwordActual, passwordNueva },
  });
}

export type GeneroApi = "M" | "F" | "X";

export interface RegistroCiudadanoDatos {
  dni: string;
  genero: GeneroApi;
  email: string;
  password: string;
  nombre?: string;
  apellido?: string;
}

export function registrarCiudadano(datos: RegistroCiudadanoDatos) {
  return pedir<{ mensaje: string; usuario: UsuarioApi }>("/usuarios/registro-ciudadano", {
    metodo: "POST",
    cuerpo: datos,
  });
}

export function pedirUsuarios() {
  return pedir<UsuarioApi[]>("/usuarios");
}

export function cambiarEstadoDeUsuario(id: string, accion: "suspender" | "reactivar") {
  return pedir<{ mensaje: string }>(`/usuarios/${id}/${accion}`, { metodo: "PATCH" });
}

export interface EmpleadoDatos {
  nombre: string;
  email: string;
  password: string;
  sectorIds: number[];
}

export function crearEmpleado(datos: EmpleadoDatos) {
  return pedir<{ mensaje: string; usuario: UsuarioApi }>("/usuarios", { metodo: "POST", cuerpo: datos });
}

export interface SectorApi {
  id: number;
  nombre: string;
  tipo?: string;
}

export interface TramiteApi {
  id: number;
  nombre: string;
  descripcion: string;
  costo: string | null;
  publicado: boolean;
  sectorId: number;
  createdAt: string;
  updatedAt: string;
  sector: SectorApi;
  encargado: { id: number; nombre: string };
}

interface RequisitoApi {
  id: number;
  descripcion: string;
  dondeSeConsigue: string | null;
  costo: string | null;
}

export interface MesaApi {
  id: number;
  nombre: string;
  direccion: string | null;
  localidad: string | null;
  horario: string | null;
  esGeneral: boolean;
  sectorId: number | null;
  sector?: { id: number; nombre: string } | null;
}

export function pedirMesas() {
  return pedir<MesaApi[]>("/mesas");
}

export interface TramiteDetalleApi extends TramiteApi {
  requisitos: RequisitoApi[];
  mesas: { mesaId: number; mesa: MesaApi | null }[];
}

export interface RequisitoDatos {
  descripcion: string;
  dondeSeConsigue?: string;
  costo?: number;
}

export interface TramiteDatos {
  nombre: string;
  descripcion: string;
  costo?: number | null;
  sectorId: number;
  requisitos: RequisitoDatos[];
  mesaIds?: number[];
}

export interface TramitePublicadoApi {
  id: number;
  nombre: string;
}

export interface ConsultasPorTramiteApi {
  tramiteId: number;
  nombre: string | null;
  sector: { id: number; nombre: string } | null;
  cantidad: number;
}

export interface ConsultaSinRespuestaApi {
  id: number;
  textoConsulta: string;
  fecha: string;
}

export function pedirTramitesPublicados() {
  return pedir<TramitePublicadoApi[]>("/tramites/publicados");
}

interface ConsultaPropiaApi {
  id: number;
  textoConsulta: string;
  encontrado: boolean;
  fecha: string;
  tramite: { id: number; nombre: string } | null;
}

export function pedirMisConsultas() {
  return pedir<ConsultaPropiaApi[]>("/consultas/mias");
}

// Filtros de /metricas/*: fechas ISO (un día de Argentina, extremos inclusivos). El server ya acota
// al Empleado (ADMINISTRADOR) a sus sectores; no hace falta mandar ?alcance=propias.
export interface FiltrosDeMetricas {
  desde?: string;
  hasta?: string;
}

function rutaDeMetrica(ruta: string, filtros: FiltrosDeMetricas) {
  const partes: string[] = [];
  if (filtros.desde) partes.push(`desde=${encodeURIComponent(filtros.desde)}`);
  if (filtros.hasta) partes.push(`hasta=${encodeURIComponent(filtros.hasta)}`);
  if (partes.length === 0) return ruta;
  return `${ruta}?${partes.join("&")}`;
}

export function pedirConsultasPorTramite(filtros: FiltrosDeMetricas = {}) {
  return pedir<ConsultasPorTramiteApi[]>(rutaDeMetrica("/metricas/por-tramite", filtros));
}

// Con alcance de sector (el Empleado) sinRespuesta y aclaraciones llegan null: no se pueden
// atribuir a un sector porque no tienen trámite.
export interface ResumenDeConsultasApi {
  respuestas: { total: number; encontradas: number; sinRespuesta: number | null };
  aclaraciones: number | null;
}

export function pedirResumenDeConsultas(filtros: FiltrosDeMetricas = {}) {
  return pedir<ResumenDeConsultasApi>(rutaDeMetrica("/metricas/resumen", filtros));
}

export interface SatisfaccionApi {
  total: number;
  utiles: number;
  noUtiles: number;
  satisfaccion: number | null;
  porTramite: {
    tramiteId: number;
    nombre: string | null;
    utiles: number;
    noUtiles: number;
    total: number;
    satisfaccion: number | null;
  }[];
}

export function pedirSatisfaccion(filtros: FiltrosDeMetricas = {}) {
  return pedir<SatisfaccionApi>(rutaDeMetrica("/metricas/calificaciones", filtros));
}

interface CalificacionApi {
  id: number;
  fecha: string;
  textoConsulta: string;
  respuesta: string | null;
  calificacion: number;
  motivoCalificacion: string | null;
  topico: string | null;
  tramiteId: number | null;
}

export interface ReporteDeCalificacionesApi {
  resumen: {
    total: number;
    utiles: number;
    noUtiles: number;
    satisfaccion: number | null;
    porMotivo: { motivo: string; cantidad: number }[];
    sinMotivo: number;
    porTopico: { topico: string; cantidad: number }[];
  };
  items: CalificacionApi[];
  total: number;
}

export interface FiltrosDeCalificaciones {
  desde?: string;
  hasta?: string;
  tramiteId?: number;
  calificacion?: number;
  page: number;
  limit: number;
}

export function pedirCalificaciones(filtros: FiltrosDeCalificaciones) {
  const partes: string[] = [];
  if (filtros.desde) partes.push(`desde=${encodeURIComponent(filtros.desde)}`);
  if (filtros.hasta) partes.push(`hasta=${encodeURIComponent(filtros.hasta)}`);
  if (filtros.tramiteId !== undefined) partes.push(`tramiteId=${filtros.tramiteId}`);
  if (filtros.calificacion !== undefined) partes.push(`calificacion=${filtros.calificacion}`);
  partes.push(`page=${filtros.page}`);
  partes.push(`limit=${filtros.limit}`);
  return pedir<ReporteDeCalificacionesApi>(`/consultas/calificaciones?${partes.join("&")}`);
}

// Solo tiene sentido para Administración: con alcance de sector el server responde [].
export function pedirConsultasSinRespuesta(filtros: FiltrosDeMetricas = {}) {
  return pedir<ConsultaSinRespuestaApi[]>(rutaDeMetrica("/metricas/sin-respuesta", filtros));
}

export interface DocumentoApi {
  id: number;
  nombre: string;
  tipo: string | null;
  createdAt: string;
}

export interface ArchivoElegido {
  uri: string;
  name: string;
  mimeType: string;
}

export function pedirTramites() {
  return pedir<TramiteApi[]>("/tramites");
}

export function pedirTramite(id: number) {
  return pedir<TramiteDetalleApi>(`/tramites/${id}`);
}

export function crearTramite(datos: TramiteDatos) {
  return pedir<TramiteApi>("/tramites", { metodo: "POST", cuerpo: datos });
}

export function actualizarTramite(id: number, datos: TramiteDatos) {
  return pedir<TramiteDetalleApi>(`/tramites/${id}`, { metodo: "PATCH", cuerpo: datos });
}

export function cambiarPublicacionDeTramite(id: number, publicar: boolean) {
  let accion = "despublicar";
  if (publicar) {
    accion = "publicar";
  }
  return pedir<{ mensaje: string }>(`/tramites/${id}/${accion}`, { metodo: "PATCH" });
}

export function eliminarTramite(id: number) {
  return pedir<null>(`/tramites/${id}`, { metodo: "DELETE" });
}

export function pedirSectores() {
  return pedir<SectorApi[]>("/sectores");
}

export function pedirMisSectores() {
  return pedir<SectorApi[]>("/usuarios/me/sectores");
}

export function pedirDocumentos(tramiteId: number) {
  return pedir<DocumentoApi[]>(`/tramites/${tramiteId}/documentos`);
}

async function agregarArchivo(formulario: FormData, archivo: ArchivoElegido) {
  if (Platform.OS === "web") {
    const respuesta = await fetch(archivo.uri);
    const contenido = await respuesta.blob();
    formulario.append("archivo", contenido, archivo.name);
  } else {
    formulario.append("archivo", { uri: archivo.uri, name: archivo.name, type: archivo.mimeType } as unknown as Blob);
  }
}

export async function subirDocumento(tramiteId: number, archivo: ArchivoElegido, nombre?: string) {
  const formulario = new FormData();
  await agregarArchivo(formulario, archivo);
  if (nombre) formulario.append("nombre", nombre);
  return pedir<DocumentoApi>(`/tramites/${tramiteId}/documentos`, { metodo: "POST", cuerpo: formulario });
}

// Link estable y público: no vence ni expone el bucket, y sirve para archivos y enlaces externos.
// Solo funciona con trámites publicados; un borrador responde 404.
export function urlDeDescargaPublica(documentoId: number) {
  return `${API_URL}/documentos/${documentoId}/descargar`;
}

// Ruta con token y URL firmada que vence a los 5 minutos. Se usa en el panel, donde el empleado
// también descarga documentos de sus trámites sin publicar.
export function pedirUrlDeDescarga(tramiteId: number, documentoId: number) {
  return pedir<{ url: string }>(`/tramites/${tramiteId}/documentos/${documentoId}/descargar`);
}

export function eliminarDocumento(tramiteId: number, documentoId: number) {
  return pedir<null>(`/tramites/${tramiteId}/documentos/${documentoId}`, { metodo: "DELETE" });
}
