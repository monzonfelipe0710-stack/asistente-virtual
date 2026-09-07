import {
  initialEmployeeRequests,
  type EmployeeRequest,
} from "../data/mockEmployeeApprovals";
import type { AuthUser } from "./auth";
import { readJSON, writeJSON } from "./storage";

export const EMPLOYEE_REQUESTS_KEY = "chatap.employeeRequests";

/** Lee las solicitudes; la primera vez siembra con los datos de ejemplo. */
export async function loadEmployeeRequests(): Promise<EmployeeRequest[]> {
  const stored = await readJSON<EmployeeRequest[] | null>(EMPLOYEE_REQUESTS_KEY, null);
  if (Array.isArray(stored)) return stored;
  await writeJSON(EMPLOYEE_REQUESTS_KEY, initialEmployeeRequests);
  return [...initialEmployeeRequests];
}

export async function saveEmployeeRequests(list: EmployeeRequest[]): Promise<void> {
  await writeJSON(EMPLOYEE_REQUESTS_KEY, list);
}

export function nextRequestId(list: EmployeeRequest[]): string {
  const nums = (list || []).map((r) => {
    const m = /(\d+)\s*$/.exec(r.id || "");
    return m ? parseInt(m[1], 10) : 0;
  });
  const next = Math.max(0, ...nums) + 1;
  return `SOL-2026-${String(next).padStart(3, "0")}`;
}

export interface EmployeeExtra {
  dni?: string;
  cuil: string;
  phone: string;
  department: string;
  position: string;
  reason?: string;
}

/** Arma la solicitud pendiente a partir de un registro con datos de empleado. */
export function buildRequestFromUser(
  user: AuthUser,
  extra: EmployeeExtra,
  list: EmployeeRequest[]
): EmployeeRequest {
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
