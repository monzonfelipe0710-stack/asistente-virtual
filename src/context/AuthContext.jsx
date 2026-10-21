import { createContext, useContext, useCallback, useMemo } from "react";
import { useSessionStore } from "../store/session";
import { login as loginRequest } from "../services/auth";
import { registroCiudadano as registroCiudadanoRequest } from "../services/usuarios";
import {
  findLocalCitizen,
  verifyLocalCitizen,
  normalizeDni,
  isValidDni,
} from "../lib/auth";
import { apiErrorMessage } from "../lib/api";
import { generoCode } from "../lib/genero";
import {
  splitFullName,
  saveCustomProfileMeta,
  loadCustomProfileMeta,
} from "../lib/profileMeta";

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
  const dni = usuario.dni || "";
  const meta = loadCustomProfileMeta(usuario.id, dni);

  const rawNombre = meta?.fullName || usuario.nombre || usuario.name || "";
  const parsed = splitFullName(rawNombre);

  const firstName =
    usuario.firstName ||
    meta?.nombre ||
    parsed.firstName ||
    "";
  const lastName =
    usuario.lastName ||
    usuario.apellido ||
    meta?.apellido ||
    parsed.lastName ||
    "";

  const fullName =
    meta?.fullName ||
    (firstName && lastName ? `${firstName} ${lastName}` : rawNombre);

  const email = usuario.email || "";
  const genero = usuario.genero || "";

  return {
    id: usuario.id,
    nombre: firstName || rawNombre,
    apellido: lastName,
    firstName,
    lastName,
    name: fullName || rawNombre,
    fullName: fullName || rawNombre,
    email,
    dni,
    genero,
    rol: usuario.rol,
    role: usuario.rol,
    phone: meta?.phone || usuario.phone || "",
    department: usuario.department || "",
    position: usuario.position || "",
    cuil: usuario.cuil || "",
    createdAt: usuario.createdAt || null,
    lastAccessAt: usuario.lastAccessAt || null,
    status: usuario.estado || usuario.status || "Activo",
    // Identificación visible cuando no hay nombre: DNI o correo.
    displayName: fullName || (dni ? `DNI ${dni}` : email),
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
        const meta = loadCustomProfileMeta(cuenta.id, cuenta.dni);
        const cuentaConMeta = {
          id: cuenta.id,
          nombre: meta?.fullName || cuenta.nombre,
          firstName: meta?.nombre || cuenta.firstName,
          lastName: meta?.apellido || cuenta.lastName,
          apellido: meta?.apellido || cuenta.apellido,
          dni: cuenta.dni,
          email: cuenta.email,
          rol: cuenta.rol,
        };
        setSession({
          token: null,
          usuario: cuentaConMeta,
        });
        return toFrontUser(cuentaConMeta);
      }

      try {
        // POST /api/auth/login acepta email o DNI; las cuentas locales de demo
        // se resolvieron antes sin salir del navegador.
        const data = await loginRequest({
          email: looksLikeEmail ? cleanEmail : undefined,
          dni: looksLikeDni ? normalizeDni(raw) : undefined,
          password,
        });
        const meta = loadCustomProfileMeta(data.usuario?.id, data.usuario?.dni);
        const mergedUser = {
          ...data.usuario,
          ...(meta?.fullName
            ? {
                nombre: meta.fullName,
                name: meta.fullName,
                firstName: meta.nombre,
                lastName: meta.apellido,
                apellido: meta.apellido,
              }
            : {}),
        };
        setSession({ token: data.token, usuario: mergedUser });
        return toFrontUser(mergedUser);
      } catch (err) {
        throw new Error(apiErrorMessage(err, "No se pudo iniciar sesión."), { cause: err });
      }
    },
    [setSession]
  );

  const register = useCallback(
    async ({ dni, gender, genero, email, password, nombre = "", apellido = "" }) => {
      const cleanDni = normalizeDni(dni);
      const selectedGender = (gender || genero || "").trim();
      const cleanGender = generoCode(selectedGender);
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!isValidDni(cleanDni)) throw new Error("Ingresá tu DNI (7 u 8 números).");
      if (!cleanGender) throw new Error("Seleccioná tu género.");
      if (!emailRegex.test(cleanEmail)) throw new Error("Ingresá un correo electrónico válido.");
      if (!password || password.length < 8)
        throw new Error("La contraseña debe tener al menos 8 caracteres.");

      const isCustomGender = cleanGender === "O" || cleanGender === "X";
      const cleanNombre = (nombre || "").trim();
      const cleanApellido = (apellido || "").trim();
      if (isCustomGender && (!cleanNombre || !cleanApellido)) {
        throw new Error("Completá tu nombre y apellido para continuar.");
      }

      const customFullName =
        cleanNombre && cleanApellido ? `${cleanNombre} ${cleanApellido}` : cleanNombre;

      // Cuenta ciudadana: el backend valida los datos contra el padrón.
      try {
        const registro = await registroCiudadanoRequest({
          dni: cleanDni,
          genero: cleanGender,
          email: cleanEmail,
          password,
          nombre: cleanNombre,
          apellido: cleanApellido,
        });
        const data = await loginRequest({ email: cleanEmail, password });

        const sessionUser = {
          ...data.usuario,
          dni: cleanDni,
          genero: cleanGender,
          ...(customFullName
            ? {
                nombre: customFullName,
                name: customFullName,
                firstName: cleanNombre,
                lastName: cleanApellido,
                apellido: cleanApellido,
              }
            : {}),
        };

        if (customFullName) {
          saveCustomProfileMeta(sessionUser.id, cleanDni, {
            nombre: cleanNombre,
            apellido: cleanApellido,
            fullName: customFullName,
          });
        }

        setSession({
          token: data.token,
          usuario: sessionUser,
        });
        return {
          mensaje: registro.mensaje || "¡Cuenta creada! Ya iniciaste sesión.",
          autoLogin: true,
          user: toFrontUser(sessionUser),
        };
      } catch (err) {
        throw new Error(apiErrorMessage(err, err.message || "No se pudo crear la cuenta."), { cause: err });
      }
    },
    [setSession]
  );

  const updateProfile = useCallback(
    async (profileData) => {
      const current = usuario || {};
      const nextFirstName = (profileData.firstName || "").trim();
      const nextLastName = (profileData.lastName || "").trim();
      const nextFullName =
        (profileData.name || "").trim() ||
        (nextFirstName && nextLastName ? `${nextFirstName} ${nextLastName}` : nextFirstName || current.nombre);

      const parsed = splitFullName(nextFullName);
      const fName = nextFirstName || parsed.firstName;
      const lName = nextLastName || parsed.lastName;

      const updated = {
        ...current,
        ...profileData,
        nombre: nextFullName,
        name: nextFullName,
        firstName: fName,
        lastName: lName,
        apellido: lName,
      };

      saveCustomProfileMeta(current.id, current.dni, {
        nombre: fName,
        apellido: lName,
        fullName: nextFullName,
        phone: profileData.phone || current.phone || "",
        department: profileData.department || current.department || "",
        position: profileData.position || current.position || "",
      });

      setSession({
        token: useSessionStore.getState().token,
        usuario: updated,
      });

      return toFrontUser(updated);
    },
    [usuario, setSession]
  );

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
        updateProfile,
        changePassword: pending,
        deleteAccount: pending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
