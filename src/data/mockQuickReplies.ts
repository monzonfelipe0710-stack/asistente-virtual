import type { IconName } from "@/components/ui/Icon";

/** Sugerencias del estado de bienvenida del chat. */
interface QuickReply {
  label: string;
  description: string;
  query: string;
  icon: IconName;
}

export const quickReplies: QuickReply[] = [
  {
    label: "Recibo de haberes",
    description: "Descargar el último mes",
    query: "Recibo de haberes",
    icon: "file",
  },
  {
    label: "Licencia médica",
    description: "Qué necesito para pedirla",
    query: "Licencia médica",
    icon: "clock",
  },
  {
    label: "Mesa de Entradas",
    description: "Horarios y qué llevar",
    query: "Mesa de Entradas",
    icon: "inbox",
  },
];
