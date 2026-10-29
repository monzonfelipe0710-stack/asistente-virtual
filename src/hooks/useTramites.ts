import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  actualizarTramite,
  cambiarPublicacionDeTramite,
  crearTramite,
  eliminarTramite,
  pedirMisSectores,
  pedirSectores,
  pedirTramites,
  type SectorApi,
  type TramiteApi,
  type TramiteDatos,
} from "@/lib/backend";

export function useTramites() {
  const { userRole, isStaff } = useAuth();
  const puedeRegistrar = isStaff && userRole === "Empleado";
  const esSuperusuario = userRole === "Administración";

  const [tramites, setTramites] = useState<TramiteApi[]>([]);
  const [sectores, setSectores] = useState<SectorApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    Promise.all([pedirTramites(), esSuperusuario ? pedirSectores() : pedirMisSectores()])
      .then(([listaTramites, listaSectores]) => {
        if (!activo) return;
        setTramites(listaTramites);
        setSectores(listaSectores);
        setError("");
      })
      .catch((e) => {
        if (activo) setError(e instanceof Error ? e.message : "No se pudieron cargar los trámites.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [esSuperusuario, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const registrar = useCallback(
    async (datos: TramiteDatos) => {
      const creado = await crearTramite(datos);
      recargar();
      return creado;
    },
    [recargar]
  );

  const actualizar = useCallback(
    async (id: number, datos: TramiteDatos) => {
      await actualizarTramite(id, datos);
      recargar();
    },
    [recargar]
  );

  const cambiarPublicacion = useCallback(
    async (id: number, publicar: boolean) => {
      await cambiarPublicacionDeTramite(id, publicar);
      recargar();
    },
    [recargar]
  );

  const eliminar = useCallback(
    async (id: number) => {
      await eliminarTramite(id);
      recargar();
    },
    [recargar]
  );

  return {
    tramites,
    sectores,
    puedeRegistrar,
    esSuperusuario,
    cargando,
    error,
    recargar,
    registrar,
    actualizar,
    cambiarPublicacion,
    eliminar,
  };
}
