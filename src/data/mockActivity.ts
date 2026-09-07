export type ActivityType = "user" | "siged" | "knowledge" | "document" | "settings";

export interface ActivityEntry {
  id: number;
  user: string;
  action: string;
  target: string;
  type: ActivityType;
  timestamp: string;
}

function ago(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const activityLog: ActivityEntry[] = [
  { id: 1, user: "María López", action: "creó el usuario", target: "Matías Sosa", type: "user", timestamp: ago(5) },
  { id: 2, user: "Carlos Fernández", action: "actualizó el expediente", target: "EXP-2026-001", type: "siged", timestamp: ago(15) },
  { id: 3, user: "Ana Martínez", action: "modificó el artículo", target: "¿Cómo solicito licencia anual?", type: "knowledge", timestamp: ago(42) },
  { id: 4, user: "Florencia Vega", action: "subió el documento", target: "Formulario de Licencia Anual", type: "document", timestamp: ago(60) },
  { id: 5, user: "Valentina Torres", action: "cambió la configuración del", target: "Chatbot", type: "settings", timestamp: ago(90) },
  { id: 6, user: "Laura Rodríguez", action: "eliminó el usuario", target: "Nicolás Álvarez", type: "user", timestamp: ago(120) },
  { id: 7, user: "Santiago Díaz", action: "cambió estado del expediente", target: "EXP-2026-004 a Finalizado", type: "siged", timestamp: ago(180) },
  { id: 8, user: "Javier Acosta", action: "agregó el artículo", target: "¿Cómo reportar un problema técnico?", type: "knowledge", timestamp: ago(240) },
  { id: 9, user: "Lucía Herrera", action: "actualizó el documento", target: "Guía de Trámites Administrativos", type: "document", timestamp: ago(300) },
  { id: 10, user: "Gonzalo Paz", action: "modificó la configuración de", target: "horario de atención", type: "settings", timestamp: ago(360) },
  { id: 11, user: "María López", action: "asignó el expediente", target: "EXP-2026-007 a Sistemas", type: "siged", timestamp: ago(420) },
  { id: 12, user: "Camila Ruiz", action: "actualizó su perfil de", target: "usuario", type: "user", timestamp: ago(480) },
  { id: 13, user: "Federico Luna", action: "desactivó el artículo", target: "¿Qué es el bono por desempeño?", type: "knowledge", timestamp: ago(540) },
  { id: 14, user: "Martín Ríos", action: "descargó el documento", target: "Manual del Empleado Público", type: "document", timestamp: ago(600) },
  { id: 15, user: "Agustina Pereyra", action: "restableció la configuración", target: "del Chatbot", type: "settings", timestamp: ago(720) },
  { id: 16, user: "Emilio Ferreyra", action: "generó el reporte", target: "de actividad mensual", type: "document", timestamp: ago(900) },
  { id: 17, user: "Sofía Castillo", action: "reactivó el artículo", target: "¿Cómo tramitar el pase?", type: "knowledge", timestamp: ago(1080) },
  { id: 18, user: "Diego Morales", action: "finalizó el expediente", target: "EXP-2026-013", type: "siged", timestamp: ago(1260) },
  { id: 19, user: "Rocío Campos", action: "cambió la contraseña de", target: "su cuenta", type: "user", timestamp: ago(1440) },
  { id: 20, user: "Matías Sosa", action: "editó el mensaje de bienvenida", target: "del Chatbot", type: "settings", timestamp: ago(1800) },
];


