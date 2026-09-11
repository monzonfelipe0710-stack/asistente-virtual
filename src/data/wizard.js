export const wizards = {
  licencia: {
    id: "licencia",
    title: "Solicitud de licencia",
    downloadText: "formulario de licencia anual",
    office: "Mesa de Entradas",
    steps: [
      {
        question: "¿Qué tipo de licencia necesitás?",
        chips: ["Licencia anual ordinaria", "Por enfermedad", "Por estudio"],
      },
      {
        question: "¿Ya tenés descargado el formulario de solicitud?",
        chips: ["Sí, lo tengo", "Todavía no, descargarlo"],
      },
      {
        final: true,
        summary(answers) {
          const tipo = answers[0] || "licencia";
          const lines = [
            `Perfecto. Para tu ${tipo.toLowerCase()} seguí estos pasos:`,
            "1) Descargá y completá el Formulario de Licencia Anual con tus datos.",
            "2) Presentalo en Mesa de Entradas (Belgrano 878) con 15 días hábiles de anticipación.",
            "3) Seguí el estado de la solicitud por SIGED hasta la notificación de aprobación.",
          ];
          if (/enfermedad/i.test(tipo)) {
            lines.splice(
              2,
              0,
              "Adjuntá el certificado médico dentro de las 48 horas de iniciada la licencia."
            );
          }
          if (/estudio/i.test(tipo)) {
            lines.splice(
              2,
              0,
              "Adjuntá el certificado de inscripción o constancia de cursada."
            );
          }
          return lines.join("\n");
        },
      },
    ],
  },
  expediente: {
    id: "expediente",
    title: "Seguimiento de expediente",
    downloadText: "guia de procedimientos siged",
    office: "Mesa de Entradas",
    steps: [
      {
        question: "¿Tenés a mano el número de expediente?",
        chips: ["Sí, lo tengo", "No lo tengo"],
      },
      {
        question: "¿Desde dónde lo vas a consultar?",
        chips: ["Desde SIGED (web)", "Desde MiPortal", "Presencial en Mesa de Entradas"],
      },
      {
        final: true,
        summary(answers) {
          const tieneNumero = /^s/i.test(answers[0] || "");
          const canal = answers[1] || "";
          const lines = [];
          if (!tieneNumero) {
            lines.push(
              "Sin el número de expediente no se puede consultar el estado. Lo vas a encontrar en la constancia que te entregó Mesa de Entradas al iniciar el trámite."
            );
          } else {
            lines.push("Perfecto, con el número de expediente podés seguir el avance así:");
          }
          if (/presencial/i.test(canal)) {
            lines.push(
              "• Pasá por Mesa de Entradas (Belgrano 878) con el número de expediente y tu DNI."
            );
          } else {
            lines.push(
              "• Ingresá a SIGED con tu usuario y clave personal en la sección Seguimiento de Expedientes."
            );
            lines.push(
              "• Cargá el número de expediente para ver el estado y las actuaciones."
            );
          }
          if (/miportal/i.test(canal)) {
            lines.push(
              "• Si preferís MiPortal, también aparece el acceso al seguimiento con tu usuario y clave."
            );
          }
          lines.push("Dudas: Departamento de Sistemas, interno 4567.");
          return lines.join("\n");
        },
      },
    ],
  },
  certificado: {
    id: "certificado",
    title: "Certificado de servicios",
    downloadText: "modelo de nota de certificacion",
    office: "Legajos",
    steps: [
      {
        question: "¿Para qué necesitás el certificado de servicios?",
        chips: ["Jubilación / trámite previsional", "Préstamo o banco", "Otro trámite"],
      },
      {
        question: "¿Ya pediste turno en el Departamento de Legajos?",
        chips: ["Sí, tengo turno", "Todavía no"],
      },
      {
        final: true,
        summary() {
          return [
            "El certificado de servicios se emite en el Departamento de Legajos.",
            "• Presentá tu DNI y, si corresponde, avisá que es para jubilación o préstamo.",
            "• La emisión tarda entre 5 y 10 días hábiles.",
            "• El certificado detalla tu antigüedad, cargos desempeñados y régimen horario.",
            "Necesitás turno previo: podés pedirlo por teléfono al interno 4567 o directamente en la oficina.",
          ].join("\n");
        },
      },
    ],
  },
};

export function wizardLabels() {
  return {
    licencia: "Iniciar asistencia paso a paso para la licencia",
    expediente: "Asistirme a seguir mi expediente",
    certificado: "Asistirme a pedir el certificado de servicios",
  };
}