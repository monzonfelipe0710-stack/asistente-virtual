// Etiquetas visibles de los roles.
//
// Los códigos que usa el backend NO cambian (SUPERUSUARIO / ADMINISTRADOR /
// CIUDADANO): acá sólo se define cómo se muestran en la interfaz.
//
//   SUPERUSUARIO  -> "Administrador"
//   ADMINISTRADOR -> "Empleado"
//   CIUDADANO     -> "Ciudadano"
//
// Se incluyen también las variantes con inicial mayúscula que usan los datos
// de ejemplo (mockUsers, employeeRequests) para no duplicar el mapeo.
const ROLE_LABELS = {
  SUPERUSUARIO: "Administrador",
  ADMINISTRADOR: "Empleado",
  CIUDADANO: "Ciudadano",
  Superadmin: "Administrador",
  SuperAdmin: "Administrador",
  Administrador: "Empleado",
  Ciudadano: "Ciudadano",
};

/** Etiqueta legible de un rol. Cualquier valor desconocido se devuelve tal cual. */
export function roleLabel(role) {
  if (!role) return "Ciudadano";
  return ROLE_LABELS[role] || role;
}
