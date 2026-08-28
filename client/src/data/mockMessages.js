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
    keywords: ["licencia", "vacaciones", "permiso"],
    response: {
      text: "Las licencias anuales reglamentarias se gestionan a través del sistema SIGED. Debés presentar la solicitud con 15 días hábiles de anticipación. También podés descargar el formulario correspondiente desde acá.",
      action: { type: "download", label: "Descargar formulario de licencia", fileName: "solicitud-licencia-anual.txt", content: "SOLICITUD DE LICENCIA ANUAL\n\nSolicitante:\nDesde:\nHasta:\nMotivo:\n\nFirma:" },
    },
  },
  {
    keywords: ["recibo", "sueldo", "haberes"],
    response: { text: "Podés consultar tus recibos de haberes a través de MiPortal (https://www.formosa.gob.ar/miportal). Si tenés problemas con el acceso, comunicate con la mesa de ayuda al 0800-555-1234." },
  },
  {
    keywords: ["trámite", "documentación", "requisito"],
    response: {
      text: "Los requisitos varían según el trámite. Te recomiendo consultar la Guía de Trámites y las plantillas disponibles para descargar. Si el trámite requiere atención presencial, también puedo indicarte dónde realizarlo.",
      action: { type: "download", label: "Descargar guía de trámites", fileName: "guia-de-tramites.txt", content: "GUIA DE TRAMITES ADMINISTRATIVOS\n\nConsulta los requisitos y pasos de cada trámite en la oficina correspondiente." },
    },
  },
  {
    keywords: ["expediente", "siged"],
    response: { text: "El Sistema de Gestión Documental (SIGED) permite realizar el seguimiento de expedientes electrónicos. Ingresá a la sección MiPortal con tu usuario y clave para consultar el estado de tus expedientes." },
  },
  {
    keywords: ["recursos humanos", "rrhh"],
    response: {
      text: "Recursos Humanos atiende consultas presenciales de lunes a viernes de 07:00 a 13:00. Podés consultar la ubicación exacta y calcular cómo llegar desde tu posición en Google Maps.",
      action: { type: "location", label: "Buscar Recursos Humanos en Google Maps", place: "Recursos Humanos, Formosa, Argentina", address: "José María Uriburu 670, Formosa", hours: "Lunes a viernes, 07:00 a 13:00" },
    },
  },
  {
    keywords: ["legajos"],
    response: {
      text: "El área de Legajos atiende de lunes a viernes de 07:00 a 13:00. Esta es la ubicación registrada para que puedas consultar cómo llegar y ver otras indicaciones en Google Maps.",
      action: { type: "location", label: "Buscar Legajos en Google Maps", place: "Departamento de Legajos, Formosa, Argentina", address: "Fotheringham 1.360, Formosa", hours: "Lunes a viernes, 07:00 a 13:00" },
    },
  },
  {
    keywords: ["formulario", "descarga", "plantilla"],
    response: {
      text: "Sí, puedo ayudarte con eso. Elegí la plantilla que necesitás y se descargará directamente para que puedas completarla.",
      action: { type: "download", label: "Descargar plantilla administrativa", fileName: "plantilla-administrativa.txt", content: "PLANTILLA ADMINISTRATIVA\n\nTema del trámite:\nSolicitante:\nDescripción:\nDocumentación adjunta:\n\nFirma:" },
    },
  },
  {
    keywords: ["ubicación", "ubicacion", "dirección", "direccion", "dónde", "donde", "horario", "presencial", "oficina"],
    response: {
      text: "Para realizar el trámite presencialmente, podés acercarte a Mesa de Entradas. Atienden de lunes a viernes de 07:00 a 13:00. Te dejo la ubicación para buscarla en Google Maps y calcular qué tan cerca queda.",
      action: { type: "location", label: "Buscar Mesa de Entradas en Google Maps", place: "Mesa de Entradas, Formosa, Argentina", address: "Belgrano 878, Formosa", hours: "Lunes a viernes, 07:00 a 13:00" },
    },
  },
  {
    keywords: ["contraseña", "contrasena", "clave", "token", "secreto", "tarjeta", "datos personales", "cuil", "dni"],
    reaction: "worried",
    response: { text: "Por seguridad, no compartas contraseñas, tokens, datos bancarios ni números completos de DNI o CUIL en este chat. Puedo orientarte sobre el trámite sin que envíes esa información. Si ya la compartiste, eliminá el mensaje y cambiá la clave correspondiente." },
  },
  {
    keywords: ["default"],
    reaction: "confus",
    response: { text: "Para brindarte información precisa, necesito más detalles. ¿Podrías especificar tu consulta? También podés consultar nuestras Preguntas Frecuentes o contactarnos por WhatsApp." },
  },
];
