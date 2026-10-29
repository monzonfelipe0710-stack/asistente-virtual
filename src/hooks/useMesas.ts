import { useCallback, useEffect, useState } from "react";

import {
  actualizarMesa,
  crearMesa,
  eliminarMesa,
  pedirMesas,
  type MesaApi,
  type MesaDatos,
} from "@/lib/backend";

export function useMesas() {
  const [mesas, setMesas] = useState<MesaApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    pedirMesas()
      .then((lista) => {
        if (!activo) return;
        setMesas(lista);
        setError("");
      })
      .catch((e) => {
        if (activo) setError(e instanceof Error ? e.message : "No se pudieron cargar las mesas.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [version]);

  const recargar = useCallback(() => {
    setCargando(true);
    setVersion((v) => v + 1);
  }, []);

  const crear = useCallback(
    async (datos: MesaDatos) => {
      const creada = await crearMesa(datos);
      recargar();
      return creada;
    },
    [recargar]
  );

  const actualizar = useCallback(
    async (id: number, datos: MesaDatos) => {
      await actualizarMesa(id, datos);
      recargar();
    },
    [recargar]
  );

  const eliminar = useCallback(
    async (id: number) => {
      await eliminarMesa(id);
      recargar();
    },
    [recargar]
  );

  return { mesas, cargando, error, recargar, crear, actualizar, eliminar };
}
