import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/compartido/sesion/AuthContext";
import {
  mensajeDeError,
  pedirConsultasPorTramite,
  pedirConsultasSinRespuesta,
  pedirResumenDeConsultas,
  pedirSatisfaccion,
  type ConsultaSinRespuestaApi,
  type ConsultasPorTramiteApi,
  type FiltrosDeMetricas,
  type ResumenDeConsultasApi,
  type SatisfaccionApi,
} from "@/compartido/lib/backend";

export const PERIODOS = ["7 días", "30 días", "Todo"] as const;
export type Periodo = (typeof PERIODOS)[number];

const DIAS_DEL_PERIODO: Record<Periodo, number | null> = {
  "7 días": 7,
  "30 días": 30,
  Todo: null,
};

function fechaIso(fecha: Date) {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// "7 días" son hoy y los 6 anteriores: el server toma una fecha sola como el día entero.
function filtrosDelPeriodo(periodo: Periodo): FiltrosDeMetricas {
  const dias = DIAS_DEL_PERIODO[periodo];
  if (dias === null) return {};
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));
  return { desde: fechaIso(desde) };
}

export function useMetricas() {
  const { userRole } = useAuth();
  // Con alcance de sector el server devuelve [] en sin-respuesta: el Empleado no la pide.
  const veSinRespuesta = userRole === "Administración";

  const [porTramite, setPorTramite] = useState<ConsultasPorTramiteApi[]>([]);
  const [sinRespuesta, setSinRespuesta] = useState<ConsultaSinRespuestaApi[]>([]);
  const [resumen, setResumen] = useState<ResumenDeConsultasApi | null>(null);
  const [satisfaccion, setSatisfaccion] = useState<SatisfaccionApi | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("Todo");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    const filtros = filtrosDelPeriodo(periodo);
    const pedirSinRespuesta = veSinRespuesta
      ? pedirConsultasSinRespuesta(filtros)
      : Promise.resolve<ConsultaSinRespuestaApi[]>([]);

    Promise.all([
      pedirConsultasPorTramite(filtros),
      pedirSinRespuesta,
      pedirResumenDeConsultas(filtros),
      pedirSatisfaccion(filtros),
    ])
      .then(([consultas, sin, totales, calificaciones]) => {
        if (!activo) return;
        setPorTramite(consultas);
        setSinRespuesta(sin);
        setResumen(totales);
        setSatisfaccion(calificaciones);
        setError("");
      })
      .catch((e) => {
        if (activo) setError(mensajeDeError(e, "No se pudieron cargar las métricas."));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [veSinRespuesta, periodo, version]);

  const recargar = useCallback(() => {
    setCargando(true);
    setVersion((v) => v + 1);
  }, []);

  const cambiarPeriodo = useCallback((nuevo: Periodo) => {
    setCargando(true);
    setPeriodo(nuevo);
  }, []);

  return {
    porTramite,
    sinRespuesta,
    resumen,
    satisfaccion,
    veSinRespuesta,
    periodo,
    cambiarPeriodo,
    cargando,
    error,
    recargar,
  };
}
