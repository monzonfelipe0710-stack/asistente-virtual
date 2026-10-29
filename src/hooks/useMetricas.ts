import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  pedirConsultasPorTramite,
  pedirConsultasSinRespuesta,
  type ConsultaSinRespuestaApi,
  type ConsultasPorTramiteApi,
} from "@/lib/backend";

export function useMetricas() {
  const { userRole } = useAuth();
  const soloPropias = userRole === "Empleado";

  const [porTramite, setPorTramite] = useState<ConsultasPorTramiteApi[]>([]);
  const [sinRespuesta, setSinRespuesta] = useState<ConsultaSinRespuestaApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([pedirConsultasPorTramite(soloPropias), pedirConsultasSinRespuesta()])
      .then(([consultas, sin]) => {
        if (!activo) return;
        setPorTramite(consultas);
        setSinRespuesta(sin);
        setError("");
      })
      .catch((e) => {
        if (activo) setError(e instanceof Error ? e.message : "No se pudieron cargar las métricas.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [soloPropias]);

  return { porTramite, sinRespuesta, cargando, error };
}
