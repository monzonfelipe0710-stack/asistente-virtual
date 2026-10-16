import type { IconName } from "@/components/ui/Icon";

export interface Acceso {
  nombre: string;
  descripcion: string;
  icono: IconName;
  /** Sin dirección, el toque muestra la descripción como aviso. */
  url?: string;
}

export const accesos: Acceso[] = [
  {
    nombre: "MiPortal",
    descripcion: "Tus datos y recibos",
    icono: "external",
    url: "https://miportal.formosa.gob.ar",
  },
  {
    nombre: "Recibo de haberes",
    descripcion: "Último período",
    icono: "file",
    url: "https://miportal.formosa.gob.ar",
  },
  {
    nombre: "WhatsApp",
    descripcion: "Escribinos al 3704-000000",
    icono: "phone",
    url: "https://wa.me/5493700000000",
  },
  {
    nombre: "Mesa de Entradas",
    descripcion: "Lunes a viernes, de 7 a 13 h",
    icono: "inbox",
  },
];
