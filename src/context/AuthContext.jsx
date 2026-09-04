import { createContext, useContext, useState, useCallback } from "react";
import {
  SESSION_KEY,
  uid,
  readJSON,
  writeJSON,
  loadUsers,
  saveUsers,
  hashPassword,
  makeSession,
} from "../lib/auth";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Emails autorizados a acceder al panel interno (Acceso Interno).
// Agregá aquí los correos de administradores / moderadores.
const STAFF_EMAILS = [
  "admin@formosa.gob.ar",
  "moderador@formosa.gob.ar",
];

function isStaffEmail(email) {
  return STAFF_EMAILS.includes((email || "").trim().toLowerCase());
}

function restoreSession() {
  const session = readJSON(SESSION_KEY, null);
  if (session && session.userId) {
    const users = loadUsers();
    return users.find((u) => u.id === session.userId) || null;
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => restoreSession());

  const login = useCallback(async (email, password) => {
    const normalized = (email || "").trim().toLowerCase();
    if (!emailRegex.test(normalized)) throw new Error("Ingresá un correo electrónico válido.");
    if (!password) throw new Error("Ingresá tu contraseña.");

    const users = loadUsers();
    const found = users.find((u) => u.email === normalized);
    if (!found) throw new Error("No existe una cuenta con ese correo. Registrate primero.");

    const hashed = await hashPassword(password);
    if (hashed !== found.password) throw new Error("Correo o contraseña incorrectos.");

    makeSession(found);
    setUser(found);
    return found;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const cleanName = (name || "").trim();
    const normalized = (email || "").trim().toLowerCase();

    if (!cleanName) throw new Error("Ingresá tu nombre.");
    if (!emailRegex.test(normalized)) throw new Error("Ingresá un correo electrónico válido.");
    if (!password || password.length < 6)
      throw new Error("La contraseña debe tener al menos 6 caracteres.");

    const users = loadUsers();
    if (users.some((u) => u.email === normalized))
      throw new Error("Ya existe una cuenta con ese correo. Iniciá sesión.");

    const hashed = await hashPassword(password);
    const newUser = {
      id: uid(),
      name: cleanName,
      email: normalized,
      password: hashed,
      provider: "email",
      createdAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);
    makeSession(newUser);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    writeJSON(SESSION_KEY, null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        isAuthenticated: !!user,
        isStaff: !!user && isStaffEmail(user.email),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
