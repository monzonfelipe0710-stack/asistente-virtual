import { createContext, useContext, useCallback, useMemo } from "react";
import { useSessionStore } from "../store/session";
import { login as loginRequest } from "../services/auth";
import { registro as registroRequest } from "../services/usuarios";
import {
  findLocalCitizen,
  registerLocalCitizen,
  verifyLocalCitizen,
} from "../lib/auth";
import { apiErrorMessage } from "../lib/api";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

// Roles del backend: SUPERUSUARIO y ADMINISTRADOR (CIUDADANO a futuro).
const PENDING_MESSAGE =
  "Esta función estará disponible próximamente (pendiente de backend).";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `usuario` del backend: { id, nombre, email, rol }. `name` es alias de `nombre`. */
function toFrontUser(usuario) {
  if (!usuario) return null;
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    role: usuario.rol,
    name: usuario.nombre || "",
  };
}

export function AuthProvider({ children }) {
  const usuario = useSessionStore((s) => s.usuario);
  const setSession = useSessionStore((s) => s.setSession);
  const logoutSession = useSessionStore((s) => s.logout);

  const user = useMemo(() => toFrontUser(usuario), [usuario]);
  const userRole = user?.role || null;

  const login = useCallback(
    async (email, password) => {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!emailRegex.test(cleanEmail)) throw new Error("Ingresá un correo electrónico válido.");
      if (!password) throw new Error("Ingresá tu contraseña.");

      // Cuenta de ciudadano local (demo): se valida en el navegador, sin JWT.
      if (findLocalCitizen(cleanEmail)) {
        const cuenta = await verifyLocalCitizen(cleanEmail, password);
        if (!cuenta) throw new Error("Credenciales inválidas.");
        setSession({
          token: null,
          usuario: { id: cuenta.id, nombre: cuenta.nombre, email: cuenta.email, rol: cuenta.rol },
        });
        return toFrontUser(cuenta);
      }

      try {
        // POST /api/auth/login → { token, usuario }
        const data = await loginRequest({ email: cleanEmail, password });
        setSession({ token: data.token, usuario: data.usuario });
        return toFrontUser(data.usuario);
      } catch (err) {
        throw new Error(apiErrorMessage(err, "No se pudo iniciar sesión."), { cause: err });
      }
    },
    [setSession]
  );

  const register = useCallback(async ({ name, email, password, rol = "CIUDADANO" }) => {
    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanName) throw new Error("Ingresá tu nombre.");
    if (!emailRegex.test(cleanEmail)) throw new Error("Ingresá un correo electrónico válido.");
    if (!password || password.length < 8)
      throw new Error("La contraseña debe tener al menos 8 caracteres.");

    // Ciudadano → cuenta local (demo) en el navegador; entra al instante.
    if (rol === "CIUDADANO") {
      try {
        const local = await registerLocalCitizen({
          nombre: cleanName,
          email: cleanEmail,
          password,
        });
        setSession({
          token: null,
          usuario: { id: local.id, nombre: local.nombre, email: local.email, rol: local.rol },
        });
        return { mensaje: "¡Cuenta creada! Ya iniciaste sesión.", autoLogin: true };
      } catch (err) {
        throw new Error(apiErrorMessage(err, "No se pudo crear la cuenta."), { cause: err });
      }
    }

    // Empleado → solicitud al backend; la cuenta queda PENDIENTE de aprobación.
    try {
      return await registroRequest({ nombre: cleanName, email: cleanEmail, password });
    } catch (err) {
      throw new Error(apiErrorMessage(err, "No se pudo completar el registro."), { cause: err });
    }
  }, [setSession]);

  const logout = useCallback(() => {
    logoutSession();
  }, [logoutSession]);

  // Pendientes de backend (secciones 7.1 y 8). La UI se mantiene.
  const pending = useCallback(() => {
    throw new Error(PENDING_MESSAGE);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading: false,
        isAuthenticated: !!user,
        isStaff: userRole === "SUPERUSUARIO" || userRole === "ADMINISTRADOR",
        isSuperadmin: userRole === "SUPERUSUARIO",
        login,
        register,
        logout,
        requestPasswordReset: pending,
        resetPassword: pending,
        updateProfile: pending,
        changePassword: pending,
        deleteAccount: pending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
