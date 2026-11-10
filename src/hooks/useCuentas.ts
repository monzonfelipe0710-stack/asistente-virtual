import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { usuarioDesdeApi, type AuthUser } from "@/lib/auth";
import {
  cambiarEstadoDeUsuario,
  crearEmpleado,
  mensajeDeError,
  pedirUsuarios,
  type EmpleadoDatos,
} from "@/lib/backend";

export type AccionDeCuenta = "aprobar" | "rechazar" | "suspender" | "reactivar";

export function useCuentas() {
  const { userRole } = useAuth();
  const puedeListar = userRole === "Administración";

  const [usuarios, setUsuarios] = useState<AuthUser[]>([]);
  const [cargando, setCargando] = useState(puedeListar);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!puedeListar) return;
    let activo = true;
    pedirUsuarios()
      .then((lista) => {
        if (!activo) return;
        setUsuarios(lista.map(usuarioDesdeApi));
        setError("");
      })
      .catch((e) => {
        if (activo) setError(mensajeDeError(e, "No se pudieron cargar los usuarios."));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [puedeListar, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const cambiarEstado = useCallback(
    async (id: string, accion: AccionDeCuenta) => {
      await cambiarEstadoDeUsuario(id, accion);
      recargar();
    },
    [recargar]
  );

  const crear = useCallback(
    async (datos: EmpleadoDatos) => {
      const respuesta = await crearEmpleado(datos);
      recargar();
      return respuesta;
    },
    [recargar]
  );

  const cuentas = useMemo(() => {
    const filtradas: AuthUser[] = [];
    for (const usuario of usuarios) {
      if (usuario.status === "Activo" || usuario.status === "Suspendido") {
        filtradas.push(usuario);
      }
    }
    return filtradas;
  }, [usuarios]);

  return { usuarios, cuentas, cargando, error, recargar, cambiarEstado, crear };
}
