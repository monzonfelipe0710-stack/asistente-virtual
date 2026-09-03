export const initialMessages = [
  {
    id: 1,
    type: "bot",
    text: "¡Hola! Soy ChatAP, el asistente virtual de la Subsecretaría de Recursos Humanos de la Provincia de Formosa. ¿En qué puedo ayudarte?",
    timestamp: "2026-06-04T09:00:00",
  },
  {
    id: 2,
    type: "bot",
    text: "Podés consultarme sobre trámites, documentación requerida, guías de procedimientos o acceder a descargas de formularios.",
    timestamp: "2026-06-04T09:00:01",
  },
];

export const botResponses = [
  {
    keywords: ["hola", "buenos", "buenas", "hey", "saludos", "como estas", "que tal", "como va"],
    response: {
      text: "¡Hola! Puedo ayudarte con trámites, expedientes, recibos y documentación. ¿Qué necesitás?",
    },
  },
  {
    keywords: ["licencia", "vacaciones", "permiso"],
    response: {
      text: "Solicitá la licencia en SIGED con 15 días hábiles de anticipación. Descargá el formulario y presentalo en Mesa de Entradas.",
      action: { type: "download", label: "Descargar formulario de licencia", fileName: "solicitud-licencia-anual.txt", content: "SOLICITUD DE LICENCIA ANUAL\n\nSolicitante:\nDesde:\nHasta:\nMotivo:\n\nFirma:" },
    },
  },
  {
    keywords: ["recibo", "sueldo", "haberes"],
    response: { text: "Consultá tus recibos en MiPortal: https://www.formosa.gob.ar/miportal/login. Si no podés ingresar, llamá al 0800-555-1234." },
  },
  {
    keywords: ["trámite", "tramite", "documentación", "requisito"],
    response: {
      text: "Los requisitos dependen del trámite. Descargá la guía para consultar los pasos y la documentación necesaria.",
      action: { type: "download", label: "Descargar guía de trámites", fileName: "guia-de-tramites.txt", content: "GUIA DE TRAMITES ADMINISTRATIVOS\n\nConsulta los requisitos y pasos de cada trámite en la oficina correspondiente." },
    },
  },
  {
    keywords: ["expediente", "siged"],
    response: { text: "Consultá tu expediente en SIGED o en MiPortal con tu usuario y clave." },
  },
  {
    keywords: ["recursos humanos", "rrhh"],
    response: {
      text: "Recursos Humanos atiende de lunes a viernes, de 07:00 a 13:00. Consultá la ubicación en el mapa.",
      action: { type: "location", label: "Buscar Recursos Humanos en Google Maps", place: "Recursos Humanos, Formosa, Argentina", address: "José María Uriburu 670, Formosa", hours: "Lunes a viernes, 07:00 a 13:00" },
    },
  },
  {
    keywords: ["legajos"],
    response: {
      text: "Legajos atiende de lunes a viernes, de 07:00 a 13:00. Consultá cómo llegar en el mapa.",
      action: { type: "location", label: "Buscar Legajos en Google Maps", place: "Departamento de Legajos, Formosa, Argentina", address: "Fotheringham 1.360, Formosa", hours: "Lunes a viernes, 07:00 a 13:00" },
    },
  },
  {
    keywords: ["formulario", "descarga", "plantilla"],
    response: {
      text: "Descargá la plantilla, completala y presentala con la documentación requerida.",
      action: { type: "download", label: "Descargar plantilla administrativa", fileName: "plantilla-administrativa.txt", content: "PLANTILLA ADMINISTRATIVA\n\nTema del trámite:\nSolicitante:\nDescripción:\nDocumentación adjunta:\n\nFirma:" },
    },
  },
  {
    keywords: ["ubicación", "ubicacion", "dirección", "direccion", "dónde", "donde", "horario", "presencial", "oficina"],
    response: {
      text: "Mesa de Entradas atiende de lunes a viernes, de 07:00 a 13:00. Consultá la ubicación en el mapa.",
      action: { type: "location", label: "Buscar Mesa de Entradas en Google Maps", place: "Mesa de Entradas, Formosa, Argentina", address: "Belgrano 878, Formosa", hours: "Lunes a viernes, 07:00 a 13:00" },
    },
  },
  {
    keywords: ["contraseña", "contrasena", "clave", "token", "secreto", "tarjeta", "datos personales", "cuil", "dni"],
    reaction: "worried",
    response: { text: "Por seguridad, no compartas contraseñas, tokens, datos bancarios ni números completos de DNI o CUIL en este chat. Puedo orientarte sobre el trámite sin que envíes esa información. Si ya la compartiste, eliminá el mensaje y cambiá la clave correspondiente." },
  },
  {
    keywords: ["operador", "persona", "asesor", "atención humana", "atencion humana"],
    response: { text: "Podés recibir atención presencial en Mesa de Entradas, de lunes a viernes, de 07:00 a 13:00." },
    action: { type: "location", label: "Ver ubicación de Mesa de Entradas", place: "Mesa de Entradas, Formosa, Argentina", address: "Belgrano 878, Formosa", hours: "Lunes a viernes, 07:00 a 13:00" },
  },
  {
    keywords: ["gracias", "genial", "perfecto", "excelente", "buenisimo", "ideal"],
    response: { text: "¡De nada! ¿Necesitás algo más?" },
  },
  {
    keywords: ["chau", "adios", "hasta luego", "bye", "nos vemos"],
    response: { text: "¡Hasta luego! Podés volver cuando quieras." },
  },
  {
    keywords: ["default"],
    reaction: "confus",
    response: { text: "No entendí la consulta. Indicame el trámite o tema que necesitás resolver." },
  },
];