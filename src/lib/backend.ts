import Constants from "expo-constants";
import { Platform } from "react-native";

export const SIN_BACKEND = "Esta función todavía no está disponible. Probá de nuevo más adelante.";

export async function faltaBackend(): Promise<never> {
  throw new Error(SIN_BACKEND);
}

// En desarrollo el backend corre en la misma computadora que Metro: se reutiliza
// su host para que funcione en web, emulador y teléfono. EXPO_PUBLIC_API_URL lo pisa.
const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${host}:3000/api`;

// Las consultas al modelo pueden tardar varios segundos.
const TIMEOUT_MS = 60000;

let token: string | null = null;
let alExpirarSesion: (() => void) | null = null;

export function fijarToken(nuevo: string | null) {
  token = nuevo;
}

export function alVencerSesion(callback: (() => void) | null) {
  alExpirarSesion = callback;
}

async function pedir<T>(
  ruta: string,
  { metodo = "GET", cuerpo, senal }: { metodo?: string; cuerpo?: unknown; senal?: AbortSignal } = {}
): Promise<T> {
  const controlador = new AbortController();
  senal?.addEventListener("abort", () => controlador.abort());
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  const conSesion = token !== null;

  const headers: Record<string, string> = {};
  const esArchivo = cuerpo instanceof FormData;
  if (cuerpo !== undefined && !esArchivo) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : esArchivo ? cuerpo : JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Probá de nuevo en un momento.");
  } finally {
    clearTimeout(temporizador);
  }

  const datos = await res.json().catch(() => null);
  if (res.status === 401 && conSesion) alExpirarSesion?.();
  if (!res.ok) throw new Error(datos?.error ?? "El servidor no pudo completar la operación.");
  return datos as T;
}

export interface MensajeChat {
  rol: "usuario" | "asistente";
  texto: string;
}

export interface RespuestaChat {
  tipo: "respuesta" | "aclaracion";
  respuesta: string;
  tramitesEncontrados: { id: number; nombre: string }[];
  opciones: { id: number; nombre: string }[];
  encontrado: boolean;
}

export function consultarChat(mensajes: MensajeChat[], senal?: AbortSignal) {
  return pedir<RespuestaChat>("/chat", { metodo: "POST", cuerpo: { mensajes }, senal });
}

export type RolApi = "SUPERUSUARIO" | "ADMINISTRADOR" | "CIUDADANO";
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

export function enviarSolicitudDeAcceso(nombre: string, email: string, password: string) {
  return faltaBackend() as Promise<{ mensaje: string }>;
}

export function pedirUsuarios() {
  return pedir<UsuarioApi[]>("/usuarios");
}

export function cambiarEstadoDeUsuario(
  id: string,
  accion: "aprobar" | "rechazar" | "suspender" | "reactivar"
) {
  if (accion === "aprobar" || accion === "rechazar") return faltaBackend() as Promise<{ mensaje: string }>;
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

export interface RequisitoApi {
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

export interface MesaDatos {
  nombre: string;
  direccion?: string;
  localidad?: string;
  horario?: string;
  esGeneral?: boolean;
  sectorId?: number | null;
}

export function pedirMesas() {
  return pedir<MesaApi[]>("/mesas");
}

export function crearMesa(datos: MesaDatos) {
  return pedir<{ mensaje: string; mesa: MesaApi }>("/mesas", { metodo: "POST", cuerpo: datos });
}

export function actualizarMesa(id: number, datos: MesaDatos) {
  return pedir<{ mensaje: string; mesa: MesaApi }>(`/mesas/${id}`, { metodo: "PATCH", cuerpo: datos });
}

export function eliminarMesa(id: number) {
  return pedir<{ mensaje: string }>(`/mesas/${id}`, { metodo: "DELETE" });
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
  costo?: number;
  sectorId: number;
  requisitos: RequisitoDatos[];
  mesaIds?: number[];
}

export interface TramitePublicadoApi {
  id: number;
  nombre: string;
}

export interface ConsultaPropiaApi {
  id: number;
  textoConsulta: string;
  encontrado: boolean;
  fecha: string;
  tramite: { id: number; nombre: string } | null;
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

export function pedirMisConsultas() {
  return pedir<ConsultaPropiaApi[]>("/consultas/mias");
}

export function pedirConsultasPorTramite(soloPropias = false) {
  return pedir<ConsultasPorTramiteApi[]>(`/metricas/por-tramite${soloPropias ? "?alcance=propias" : ""}`);
}

export function pedirConsultasSinRespuesta() {
  return pedir<ConsultaSinRespuestaApi[]>("/metricas/sin-respuesta");
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
  return pedir<{ mensaje: string }>(`/tramites/${id}/${publicar ? "publicar" : "despublicar"}`, {
    metodo: "PATCH",
  });
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

export async function subirDocumento(tramiteId: number, archivo: ArchivoElegido, nombre?: string) {
  const formulario = new FormData();
  if (Platform.OS === "web") {
    const contenido = await fetch(archivo.uri).then((r) => r.blob());
    formulario.append("archivo", contenido, archivo.name);
  } else {
    formulario.append("archivo", { uri: archivo.uri, name: archivo.name, type: archivo.mimeType } as unknown as Blob);
  }
  if (nombre) formulario.append("nombre", nombre);
  return pedir<DocumentoApi>(`/tramites/${tramiteId}/documentos`, { metodo: "POST", cuerpo: formulario });
}

export function pedirUrlDeDescarga(tramiteId: number, documentoId: number) {
  return pedir<{ url: string }>(`/tramites/${tramiteId}/documentos/${documentoId}/descargar`);
}

export function eliminarDocumento(tramiteId: number, documentoId: number) {
  return pedir<null>(`/tramites/${tramiteId}/documentos/${documentoId}`, { metodo: "DELETE" });
}
