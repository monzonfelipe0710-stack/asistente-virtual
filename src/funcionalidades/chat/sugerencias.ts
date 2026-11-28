import type { IconName } from "@/compartido/ui/Icon";

interface QuickReply {
  label: string;
  description: string;
  query: string;
  icon: IconName;
}

// Misma consulta que arma el front web al elegir un trámite publicado; el nombre tiene
// que coincidir con el del trámite para que el asistente lo encuentre.
function consultaDeTramite(nombre: string) {
  return `Quiero iniciar el trámite "${nombre}". ¿Cómo debo hacer la gestión?`;
}

// Los tres trámites con más demanda en Formosa capital según la investigación de noviembre de 2026:
// licencia de conducir (más de 200 por día), buena conducta y libre deuda municipal.
export const quickReplies: QuickReply[] = [
  {
    label: "Licencia de conducir",
    description: "Requisitos para obtenerla",
    query: consultaDeTramite("Requisitos para obtener la Licencia Nacional de Conducir"),
    icon: "user",
  },
  {
    label: "Certificado de Buena Conducta",
    description: "Policía de Formosa",
    query: consultaDeTramite("Solicitud de Certificado de Buena Conducta"),
    icon: "shield",
  },
  {
    label: "Libre deuda inmobiliario",
    description: "Municipalidad de Formosa",
    query: consultaDeTramite("Libre Deuda del Impuesto Inmobiliario y Tasa Única de Servicios"),
    icon: "home",
  },
];
