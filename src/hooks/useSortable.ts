import { useMemo, useState } from "react";

type Direccion = "asc" | "desc";

function compararValores<V>(a: V, b: V) {
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b, "es", { sensitivity: "base" });
  }
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

function invertirDireccion(direccion: Direccion): Direccion {
  if (direccion === "asc") {
    return "desc";
  }
  return "asc";
}

export function useSortable<T extends object>(
  elementos: T[],
  claveInicial: keyof T | null = null,
  direccionInicial: Direccion = "asc"
) {
  const [claveElegida, setClaveElegida] = useState<keyof T | null>(claveInicial);
  const [direccion, setDireccion] = useState<Direccion>(direccionInicial);

  const elementosOrdenados = useMemo(() => {
    if (claveElegida === null) {
      return elementos;
    }

    const copia = [...elementos];
    copia.sort((a, b) => {
      const resultado = compararValores(a[claveElegida], b[claveElegida]);
      if (direccion === "asc") {
        return resultado;
      }
      return -resultado;
    });
    return copia;
  }, [elementos, claveElegida, direccion]);

  function cambiarOrden(clave: keyof T) {
    if (clave === claveElegida) {
      setDireccion(invertirDireccion(direccion));
    } else {
      setClaveElegida(clave);
      setDireccion("asc");
    }
  }

  return {
    sorted: elementosOrdenados,
    sortDir: direccion,
    toggleSort: cambiarOrden,
  };
}
