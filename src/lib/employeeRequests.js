import { initialEmployeeRequests } from "../data/mockEmployeeApprovals";

export const EMPLOYEE_REQUESTS_KEY = "chatap.employeeRequests";

function readLS() {
  try {
    const raw = window.localStorage.getItem(EMPLOYEE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLS(value) {
  try {
    window.localStorage.setItem(EMPLOYEE_REQUESTS_KEY, JSON.stringify(value));
  } catch {
    /* quota / privacy mode */
  }
}

// Lee las solicitudes (la primera vez siembra con los datos de ejemplo).
export function loadEmployeeRequests() {
  const stored = readLS();
  if (Array.isArray(stored)) return stored;
  writeLS(initialEmployeeRequests);
  return [...initialEmployeeRequests];
}

export function saveEmployeeRequests(list) {
  writeLS(list);
}

export function nextRequestId(list) {
  const nums = (list || []).map((r) => {
    const m = /(\d+)\s*$/.exec(r.id || "");
    return m ? parseInt(m[1], 10) : 0;
  });
  const next = Math.max(0, ...nums) + 1;
  return `SOL-2026-${String(next).padStart(3, "0")}`;
}

// Arma la solicitud pendiente a partir de un registro con datos de empleado.
export function buildRequestFromUser(user, extra, list) {
  const digits = String(extra.cuil || "").replace(/\D/g, "");
  return {
    id: nextRequestId(list),
    userId: user.id,
    name: user.name,
    email: user.email,
    // El DNI va incluido en el CUIL: se deriva para compatibilidad.
    dni: extra.dni || digits.slice(2, -1),
    cuil: extra.cuil,
    phone: extra.phone,
    department: extra.department,
    position: extra.position,
    role: "Administrador",
    requestedAt: new Date().toISOString(),
    status: "Pendiente",
    submittedBy: "Autogestión · Registro de cuenta",
    reason: extra.reason
      ? extra.reason
      : "Solicitud de alta como empleado desde el registro.",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: "",
  };
}
