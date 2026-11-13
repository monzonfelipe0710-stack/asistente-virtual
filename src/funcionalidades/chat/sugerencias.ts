import type { IconName } from "@/compartido/ui/Icon";

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
