import { useAuth } from "@/context/AuthContext";
import type { AuthRole } from "@/lib/auth";
import { PERMISSIONS, type Permission } from "@/lib/permisos";

export function usePermisos() {
  const { userRole } = useAuth();
  const role: AuthRole = userRole ?? "Ciudadano";

  function can(permiso: Permission) {
    return PERMISSIONS[role].includes(permiso);
  }

  return { role, can };
}
