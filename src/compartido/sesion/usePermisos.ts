import { useAuth } from "./AuthContext";
import type { AuthRole } from "./auth";
import { PERMISSIONS, type Permission } from "./permisos";

export function usePermisos() {
  const { userRole } = useAuth();
  const role: AuthRole = userRole ?? "Ciudadano";

  function can(permiso: Permission) {
    return PERMISSIONS[role].includes(permiso);
  }

  return { role, can };
}
