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

export const quickReplies: QuickReply[] = [
  {
    label: "Enfermedad profesional",
    description: "Accidente de trabajo",
    query: consultaDeTramite("Accidente de trabajo - Enfermedad Profesional"),
    icon: "alert",
  },
  {
    label: "Accidente in itinere",
    description: "Entre el domicilio particular y el lugar de trabajo",
    query: consultaDeTramite(
      "Accidente de trabajo - In itinere: infortunio ocurrido entre el domicilio particular y el lugar de trabajo"
    ),
    icon: "home",
  },
  {
    label: "Accidente en el trabajo",
    description: "Por el hecho o en ocasión del mismo",
    query: consultaDeTramite("Accidente de trabajo - Por el hecho o en ocasión del mismo"),
    icon: "shield",
  },
];
