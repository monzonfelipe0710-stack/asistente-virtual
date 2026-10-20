import { createContext, useContext, useCallback, useMemo } from "react";
import { useSessionStore } from "../store/session";
import { login as loginRequest } from "../services/auth";
import {
  registro as registroRequest,
  registroCiudadano as registroCiudadanoRequest,
} from "../services/usuarios";
import {
  findLocalCitizen,
  verifyLocalCitizen,
  normalizeDni,
  isValidDni,
} from "../lib/auth";
import { apiErrorMessage } from "../lib/api";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

// Roles del backend: SUPERUSUARIO, ADMINISTRADOR y CIUDADANO.
const PENDING_MESSAGE =
  "Esta función estará disponible próximamente (pendiente de backend).";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `usuario` del backend: { id, nombre, email, rol, dni? }. `name` es alias de `nombre`. */
function toFrontUser(usuario) {
  if (!usuario) return null;
  const nombre = usuario.nombre || "";
  const email = usuario.email || "";
  const dni = usuario.dni || "";
  const genero = usuario.genero || "";
  return {
    id: usuario.id,
    nombre,
    email,
    dni,
    genero,
    rol: usuario.rol,
    role: usuario.rol,
    name: nombre,
    // Identificación visible cuando no hay nombre: DNI o correo.
    displayName: nombre || (dni ? `DNI ${dni}` : email),
  };
}

export function AuthProvider({ children }) {
  const usuario = useSessionStore((s) => s.usuario);
  const setSession = useSessionStore((s) => s.setSession);
  const logoutSession = useSessionStore((s) => s.logout);

  const user = useMemo(() => toFrontUser(usuario), [usuario]);
  const userRole = user?.role || null;

  const login = useCallback(
    async (identifier, password) => {
      const raw = (identifier || "").trim();
      const cleanEmail = raw.toLowerCase();
      const looksLikeEmail = emailRegex.test(cleanEmail);
      const looksLikeDni = isValidDni(raw);

      if (!looksLikeEmail && !looksLikeDni) {
        throw new Error("Ingresá tu DNI (7 u 8 números) o tu correo electrónico.");
      }
      if (!password) throw new Error("Ingresá tu contraseña.");

      // Cuenta de ciudadano local (demo): se valida en el navegador, sin JWT.
      // El identificador puede ser el DNI o el correo.
      const local = findLocalCitizen(raw);
      if (local) {
        const cuenta = await verifyLocalCitizen(raw, password);
        if (!cuenta) throw new Error("Credenciales inválidas.");
        setSession({
          token: null,
          usuario: {
            id: cuenta.id,
            nombre: cuenta.nombre,
            dni: cuenta.dni,
            email: cuenta.email,
            rol: cuenta.rol,
          },
        });
        return toFrontUser(cuenta);
      }

      try {
        // POST /api/auth/login acepta email o DNI; las cuentas locales de demo
        // se resolvieron antes sin salir del navegador.
        const data = await loginRequest({
          email: looksLikeEmail ? cleanEmail : undefined,
          dni: looksLikeDni ? normalizeDni(raw) : undefined,
          password,
        });
        setSession({ token: data.token, usuario: data.usuario });
        return toFrontUser(data.usuario);
      } catch (err) {
        throw new Error(apiErrorMessage(err, "No se pudo iniciar sesión."), { cause: err });
      }
    },
    [setSession]
  );

  const register = useCallback(async ({ name, dni, gender, genero, email, password, rol = "CIUDADANO", cuil }) => {
    const cleanName = (name || "").trim();
    const cleanDni = normalizeDni(dni);
    const selectedGender = (gender || genero || "").trim();
    const cleanGender = {
      Masculino: "M",
      Femenino: "F",
    }[selectedGender] || selectedGender;
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!isValidDni(cleanDni)) throw new Error("Ingresá tu DNI (7 u 8 números).");
    if (!cleanGender) throw new Error("Seleccioná tu género.");
    if (!emailRegex.test(cleanEmail)) throw new Error("Ingresá un correo electrónico válido.");
    if (!password || password.length < 8)
      throw new Error("La contraseña debe tener al menos 8 caracteres.");

    // Cuenta ciudadana real: el backend valida los datos del padrón.
    if (rol === "CIUDADANO") {
      try {
        const registro = await registroCiudadanoRequest({
          dni: cleanDni,
          genero: cleanGender,
          email: cleanEmail,
          password,
        });
        const data = await loginRequest({ email: cleanEmail, password });
        setSession({
          token: data.token,
          usuario: { ...data.usuario, dni: cleanDni, genero: cleanGender },
        });
        return {
          mensaje: registro.mensaje || "¡Cuenta creada! Ya iniciaste sesión.",
          autoLogin: true,
          user: toFrontUser({ ...data.usuario, dni: cleanDni, genero: cleanGender }),
        };
      } catch (err) {
        throw new Error(apiErrorMessage(err, err.message || "No se pudo crear la cuenta."), { cause: err });
      }
    }

    // Empleado → solicitud al backend; la cuenta queda PENDIENTE de aprobación.
    try {
      return await registroRequest({
        nombre: cleanName || `DNI ${cleanDni}`,
        dni: cleanDni,
        genero: cleanGender,
        email: cleanEmail,
        password,
        cuil: String(cuil || "").replace(/\D/g, ""),
      });
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
