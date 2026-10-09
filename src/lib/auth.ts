import * as Crypto from "expo-crypto";

import { readJSON, writeJSON } from "./storage";

export const USERS_KEY = "chatap.users";
export const SESSION_KEY = "chatap.session";

export type AuthRole = "Superadmin" | "Administrador" | "Ciudadano";

/** Cuenta guardada en el dispositivo. `password` es el hash, nunca el texto. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AuthRole;
  status?: "Activo" | "Pendiente" | "Rechazado";
  dni?: string;
  cuil?: string;
  phone?: string;
  department?: string;
  position?: string;
  provider: string;
  createdAt: string;
  lastAccessAt: string;
}

export interface Session {
  token: string;
  userId: string;
  issuedAt: string;
}

export function uid(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

export async function loadUsers(): Promise<AuthUser[]> {
  const users = await readJSON<AuthUser[]>(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

export async function saveUsers(users: AuthUser[]): Promise<void> {
  await writeJSON(USERS_KEY, users);
}

/**
 * Hash de demostración con SHA-256 y sal fija, igual que el panel web.
 *
 * NO es apto para producción: un SHA-256 se calcula demasiado rápido y una sal
 * compartida no protege contra tablas precalculadas. En producción esto lo hace
 * el backend con bcrypt/argon2 y la contraseña nunca se guarda en el equipo.
 * ponytail: se mantiene tal cual mientras los datos sean simulados; cambia el
 * día que haya API real.
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      "chatap::" + password + "::formosa"
    );
  } catch {
    return "plain:" + password;
  }
}

export async function makeSession(user: AuthUser): Promise<Session> {
  const session: Session = {
    token: "sess_" + uid().replace(/-/g, "") + "_" + Date.now().toString(36),
    userId: user.id,
    issuedAt: new Date().toISOString(),
  };
  await writeJSON(SESSION_KEY, session);
  return session;
}
