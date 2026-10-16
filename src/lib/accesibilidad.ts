import { useSyncExternalStore } from "react";

import { readJSON, writeJSON } from "@/lib/storage";

export const ESCALAS = { Normal: 1, Grande: 1.15, "Muy grande": 1.3, Enorme: 1.6 } as const;

export type TamanoDeTexto = keyof typeof ESCALAS;

export interface Ajustes {
  tamanoDeTexto: TamanoDeTexto;
  altoContraste: boolean;
  reducirAnimaciones: boolean;
  letraLegible: boolean;
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  tamanoDeTexto: "Normal",
  altoContraste: false,
  reducirAnimaciones: false,
  letraLegible: false,
};

const CLAVE = "chatap.accesibilidad";

let ajustes = AJUSTES_POR_DEFECTO;
const listeners = new Set<() => void>();

function avisar() {
  listeners.forEach((escuchar) => escuchar());
}

function subscribe(escuchar: () => void) {
  listeners.add(escuchar);
  return () => void listeners.delete(escuchar);
}

const getAjustes = () => ajustes;

export function useAjustes(): Ajustes {
  return useSyncExternalStore(subscribe, getAjustes, getAjustes);
}

export function cambiarAjustes(cambios: Partial<Ajustes>) {
  ajustes = { ...ajustes, ...cambios };
  avisar();
  writeJSON(CLAVE, ajustes);
}

export async function cargarAjustes() {
  ajustes = { ...ajustes, ...(await readJSON<Partial<Ajustes>>(CLAVE, {})) };
  avisar();
}
