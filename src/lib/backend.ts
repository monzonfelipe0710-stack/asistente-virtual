import Constants from "expo-constants";

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
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
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

export interface RespuestaChat {
  respuesta: string;
  tramitesEncontrados: { id: number; nombre: string }[];
  encontrado: boolean;
}

export function consultarChat(pregunta: string, senal?: AbortSignal) {
  return pedir<RespuestaChat>("/chat", { metodo: "POST", cuerpo: { pregunta }, senal });
}

export type RolApi = "SUPERUSUARIO" | "ADMINISTRADOR";
export type EstadoApi = "PENDIENTE" | "APROBADO" | "RECHAZADO" | "SUSPENDIDO";

export interface UsuarioApi {
  id: number;
  nombre: string;
  email: string;
  rol: RolApi;
  estado?: EstadoApi;
  createdAt?: string;
}

export function iniciarSesion(email: string, password: string) {
  return pedir<{ token: string; usuario: UsuarioApi }>("/auth/login", {
    metodo: "POST",
    cuerpo: { email, password },
  });
}

export function enviarSolicitudDeAcceso(nombre: string, email: string, password: string) {
  return pedir<{ mensaje: string }>("/usuarios/registro", {
    metodo: "POST",
    cuerpo: { nombre, email, password },
  });
}

export function pedirUsuarios() {
  return pedir<UsuarioApi[]>("/usuarios");
}

export function cambiarEstadoDeUsuario(
  id: string,
  accion: "aprobar" | "rechazar" | "suspender" | "reactivar"
) {
  return pedir<{ mensaje: string }>(`/usuarios/${id}/${accion}`, { metodo: "PATCH" });
}
