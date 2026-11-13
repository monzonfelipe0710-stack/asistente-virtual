import type { ConsultasPorTramiteApi, TramiteApi } from "@/compartido/lib/backend";

export function filtrarPorBusqueda(lista: TramiteApi[], busqueda: string) {
  const q = busqueda.trim().toLowerCase();
  if (!q) return lista;
  return lista.filter((t) => {
    if (t.nombre.toLowerCase().includes(q)) return true;
    if (t.sector.nombre.toLowerCase().includes(q)) return true;
    if (t.encargado.nombre.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function ordenarPorActualizacion(lista: TramiteApi[]) {
  const copia = [...lista];
  copia.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return copia;
}

export function sumarConsultasRespondidas(porTramite: ConsultasPorTramiteApi[]) {
  let total = 0;
  for (const tramite of porTramite) {
    total = total + tramite.cantidad;
  }
  return total;
}
