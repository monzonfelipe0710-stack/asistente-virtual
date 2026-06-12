function ago(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export const activityLog = [
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

export const typeIcons = {
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  siged: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  knowledge: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  document: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
};

export const typeColors = {
  user: "bg-blue-50 text-blue-600",
  siged: "bg-amber-50 text-amber-600",
  knowledge: "bg-purple-50 text-purple-600",
  document: "bg-emerald-50 text-emerald-600",
  settings: "bg-slate-50 text-slate-600",
};
