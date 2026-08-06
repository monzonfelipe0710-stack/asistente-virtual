export type SigedStatus = "Ingresado" | "En proceso" | "Observado" | "Finalizado";

export interface SigedRecord {
  id: string;
  type: string;
  applicant: string;
  department: string;
  date: string;
  status: SigedStatus;
  lastMovement: string;
}

export const sigedRecords: SigedRecord[] = [
  {
    id: "EXP-2026-00452",
    type: "Solicitud de Licencia",
    applicant: "María González",
    department: "Mesa de Entradas",
    date: "2026-06-01",
    status: "En proceso",
    lastMovement: "Pase a Dirección General",
  },
  {
    id: "EXP-2026-00453",
    type: "Certificación de Servicios",
    applicant: "Ana Martínez",
    department: "Recursos Humanos",
    date: "2026-06-02",
    status: "Finalizado",
    lastMovement: "Certificado emitido",
  },
  {
    id: "EXP-2026-00454",
    type: "Declaración Jurada",
    applicant: "Pedro López",
    department: "Legajos",
    date: "2026-05-30",
    status: "Observado",
    lastMovement: "Requiere documentación adicional",
  },
  {
    id: "EXP-2026-00455",
    type: "Solicitud de Viáticos",
    applicant: "Laura Fernández",
    department: "Liquidaciones",
    date: "2026-06-03",
    status: "En proceso",
    lastMovement: "En evaluación presupuestaria",
  },
  {
    id: "EXP-2026-00456",
    type: "Pase a Planta Permanente",
    applicant: "Jorge Ramírez",
    department: "Sistemas",
    date: "2026-05-15",
    status: "Finalizado",
    lastMovement: "Resolución publicada",
  },
  {
    id: "EXP-2026-00457",
    type: "Permiso por Estudio",
    applicant: "Carlos Rodríguez",
    department: "Sistemas",
    date: "2026-06-04",
    status: "Ingresado",
    lastMovement: "Mesa de Entradas - Pendiente de asignación",
  },
];

export const sigedStatuses: SigedStatus[] = ["Ingresado", "En proceso", "Observado", "Finalizado"];

export type UserRole = "Agente" | "Administrador" | "Supervisor";
export type UserStatus = "Activo" | "Inactivo";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  lastAccess: string;
}

export const users: AppUser[] = [
  {
    id: 1,
    name: "María González",
    email: "mgonzalez@subsechh.formosa.gob.ar",
    role: "Agente",
    department: "Mesa de Entradas",
    status: "Activo",
    lastAccess: "2026-06-03 14:30",
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    email: "crodriguez@subsechh.formosa.gob.ar",
    role: "Administrador",
    department: "Sistemas",
    status: "Activo",
    lastAccess: "2026-06-04 09:15",
  },
  {
    id: 3,
    name: "Ana Martínez",
    email: "amartinez@subsechh.formosa.gob.ar",
    role: "Agente",
    department: "Recursos Humanos",
    status: "Activo",
    lastAccess: "2026-06-02 11:00",
  },
  {
    id: 4,
    name: "Pedro López",
    email: "plopez@subsechh.formosa.gob.ar",
    role: "Supervisor",
    department: "Legajos",
    status: "Inactivo",
    lastAccess: "2026-05-28 16:45",
  },
  {
    id: 5,
    name: "Laura Fernández",
    email: "lfernandez@subsechh.formosa.gob.ar",
    role: "Agente",
    department: "Liquidaciones",
    status: "Activo",
    lastAccess: "2026-06-04 08:00",
  },
  {
    id: 6,
    name: "Jorge Ramírez",
    email: "jramirez@subsechh.formosa.gob.ar",
    role: "Administrador",
    department: "Sistemas",
    status: "Activo",
    lastAccess: "2026-06-03 18:20",
  },
];