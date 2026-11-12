import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Screen } from "@/components/ui/Screen";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { useTramites } from "@/hooks/useTramites";
import {
  mensajeDeError,
  pedirCalificaciones,
  type FiltrosDeCalificaciones,
  type ReporteDeCalificacionesApi,
} from "@/lib/backend";
import { formatDate } from "@/utils/date";

const TODOS_LOS_TRAMITES = "Todos los trámites";
const OPCIONES_DE_CALIFICACION = ["Todas", "Útil", "No útil"] as const;
const OPCIONES_POR_PAGINA = ["10", "20", "50"] as const;
const FORMATO_DE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function formatDateTime(d: Date): string {
  const hora = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${formatDate(d)}, ${hora}`;
}

function esFechaValida(texto: string) {
  if (!FORMATO_DE_FECHA.test(texto)) return false;
  const anio = Number(texto.slice(0, 4));
  const mes = Number(texto.slice(5, 7));
  const dia = Number(texto.slice(8, 10));
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

function formatearFecha(texto: string) {
  const numeros = texto.replace(/\D/g, "").slice(0, 8);
  if (numeros.length <= 4) return numeros;
  if (numeros.length <= 6) return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
  return `${numeros.slice(0, 4)}-${numeros.slice(4, 6)}-${numeros.slice(6)}`;
}

type Calificacion = (typeof OPCIONES_DE_CALIFICACION)[number];
type PorPagina = (typeof OPCIONES_POR_PAGINA)[number];

interface Pedido {
  desde: string;
  hasta: string;
  tramiteId: number | null;
  calificacion: number | null;
  page: number;
  limit: number;
  version: number;
}

function Metrica({
  etiqueta,
  valor,
  detalle,
  ancho,
}: {
  etiqueta: string;
  valor: string;
  detalle: string;
  ancho: string;
}) {
  const C = useColors();
  return (
    <View style={[styles.metrica, { flexBasis: ancho as `${number}%`, backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={[Type.label, { color: C.ink2 }]}>{etiqueta}</Text>
      <Text style={[Type.figure, { color: C.ink }]}>{valor}</Text>
      <Text style={[Type.meta, { color: C.ink3 }]}>{detalle}</Text>
    </View>
  );
}

function Desglose({
  titulo,
  filas,
  vacio,
  ancho,
}: {
  titulo: string;
  filas: { nombre: string; cantidad: number }[];
  vacio: string;
  ancho: boolean;
}) {
  const C = useColors();
  let maximo = 0;
  for (const fila of filas) {
    if (fila.cantidad > maximo) maximo = fila.cantidad;
  }

  return (
    <View
      style={[
        styles.tarjeta,
        styles.desglose,
        { backgroundColor: C.surface, borderColor: C.border },
        ancho ? styles.mitad : null,
      ]}
    >
      <Text style={[Type.cardTitle, { color: C.ink }]}>{titulo}</Text>
      {filas.length === 0 ? (
        <Text style={[Type.meta, { color: C.ink3 }]}>{vacio}</Text>
      ) : (
        filas.map((fila) => {
          const porcentaje = maximo > 0 ? (fila.cantidad / maximo) * 100 : 0;
          return (
            <View key={fila.nombre} style={styles.desgloseFila}>
              <View style={styles.desgloseTexto}>
                <Text style={[Type.meta, { color: C.ink, flexShrink: 1 }]} numberOfLines={2}>
                  {fila.nombre}
                </Text>
                <Text style={[Type.metaStrong, { color: C.ink, fontWeight: Weight.bold }]}>{fila.cantidad}</Text>
              </View>
              <View style={[styles.pista, { backgroundColor: C.surface2 }]}>
                <View style={[styles.relleno, { width: `${porcentaje}%`, backgroundColor: C.accent }]} />
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

export default function Calificaciones() {
  const C = useColors();
  const { width } = useWindowDimensions();
  const ancho = width >= 1024;
  const mediano = width >= 640;

  const { tramites, cargando: tramitesCargando, error: tramitesError } = useTramites();

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tramite, setTramite] = useState(TODOS_LOS_TRAMITES);
  const [calificacion, setCalificacion] = useState<Calificacion>("Todas");
  const [errorDeFiltro, setErrorDeFiltro] = useState("");

  const [pedido, setPedido] = useState<Pedido>({
    desde: "",
    hasta: "",
    tramiteId: null,
    calificacion: null,
    page: 1,
    limit: 20,
    version: 0,
  });
  const [reporte, setReporte] = useState<ReporteDeCalificacionesApi | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [abiertas, setAbiertas] = useState<number[]>([]);

  useEffect(() => {
    let activo = true;
    const filtros: FiltrosDeCalificaciones = { page: pedido.page, limit: pedido.limit };
    if (pedido.desde) filtros.desde = pedido.desde;
    if (pedido.hasta) filtros.hasta = pedido.hasta;
    if (pedido.tramiteId !== null) filtros.tramiteId = pedido.tramiteId;
    if (pedido.calificacion !== null) filtros.calificacion = pedido.calificacion;

    pedirCalificaciones(filtros)
      .then((datos) => {
        if (!activo) return;
        if (
          !datos?.resumen ||
          !Array.isArray(datos.items) ||
          !Array.isArray(datos.resumen.porMotivo) ||
          !Array.isArray(datos.resumen.porTopico)
        ) {
          setReporte(null);
          setError("El servidor devolvió un formato inesperado para las calificaciones.");
          return;
        }
        setReporte(datos);
        setError("");
      })
      .catch((e) => {
        if (!activo) return;
        setReporte(null);
        setError(mensajeDeError(e, "No se pudieron cargar las calificaciones."));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [pedido]);

  function pedirDeNuevo(cambios: Partial<Pedido>) {
    setCargando(true);
    setAbiertas([]);
    setPedido((anterior) => ({ ...anterior, ...cambios }));
  }

  function aplicarFiltros() {
    const desdeLimpio = desde.trim();
    const hastaLimpio = hasta.trim();
    if ((desdeLimpio && !esFechaValida(desdeLimpio)) || (hastaLimpio && !esFechaValida(hastaLimpio))) {
      setErrorDeFiltro("Escribí una fecha real con año, mes y día, por ejemplo 2026-11-04.");
      return;
    }
    if (desdeLimpio && hastaLimpio && desdeLimpio > hastaLimpio) {
      setErrorDeFiltro("La fecha “desde” no puede ser posterior a “hasta”.");
      return;
    }
    setErrorDeFiltro("");

    let tramiteId: number | null = null;
    if (tramite !== TODOS_LOS_TRAMITES) {
      const elegido = tramites.find((t) => t.nombre === tramite);
      if (elegido) tramiteId = elegido.id;
    }

    let valor: number | null = null;
    if (calificacion === "Útil") valor = 1;
    if (calificacion === "No útil") valor = 0;

    pedirDeNuevo({ desde: desdeLimpio, hasta: hastaLimpio, tramiteId, calificacion: valor, page: 1 });
  }

  function limpiarFiltros() {
    setDesde("");
    setHasta("");
    setTramite(TODOS_LOS_TRAMITES);
    setCalificacion("Todas");
    setErrorDeFiltro("");
    pedirDeNuevo({ desde: "", hasta: "", tramiteId: null, calificacion: null, page: 1 });
  }

  function alternarRespuesta(id: number) {
    if (abiertas.includes(id)) {
      setAbiertas(abiertas.filter((x) => x !== id));
    } else {
      setAbiertas([...abiertas, id]);
    }
  }

  const resumen = reporte?.resumen;
  const total = reporte ? Number(reporte.total ?? resumen?.total) || 0 : 0;
  const paginas = Math.max(1, Math.ceil(total / pedido.limit));

  const motivos = resumen
    ? [
        ...resumen.porMotivo.map((m) => ({ nombre: m.motivo, cantidad: Number(m.cantidad) || 0 })),
        { nombre: "Sin motivo", cantidad: resumen.sinMotivo || 0 },
      ]
    : [];
  const topicos = resumen
    ? resumen.porTopico.map((t) => ({ nombre: t.topico, cantidad: Number(t.cantidad) || 0 }))
    : [];

  let satisfaccion = "Sin datos";
  if (resumen && typeof resumen.satisfaccion === "number" && Number.isFinite(resumen.satisfaccion)) {
    satisfaccion = `${resumen.satisfaccion.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
  }

  function cifra(valor: number | undefined) {
    if (cargando || valor === undefined) return "—";
    return String(valor);
  }

  const opcionesDeTramite = [TODOS_LOS_TRAMITES, ...tramites.map((t) => t.nombre)];
  const anchoDeFiltro = ancho ? "22%" : mediano ? "45%" : "100%";
  const anchoDeMetrica = ancho ? "22%" : mediano ? "45%" : "100%";

  let estado = `${total} valoraciones en el resultado`;
  if (cargando) estado = "Cargando calificaciones…";
  else if (error) estado = "No se pudieron actualizar los datos";

  return (
    <Screen>
      <PageHeader
        title="Calificaciones"
        description="Seguimiento de las valoraciones de la ciudadanía para conocer la utilidad de las respuestas y detectar oportunidades de mejora."
      />

      <View style={[styles.tarjeta, styles.filtros, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.filtrosCampos}>
          <View style={{ flexGrow: 1, flexBasis: anchoDeFiltro }}>
            <Field label="Desde">
              <Input
                value={desde}
                onChangeText={(texto) => setDesde(formatearFecha(texto))}
                placeholder="AAAA-MM-DD"
                autoCapitalize="none"
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={10}
              />
            </Field>
          </View>
          <View style={{ flexGrow: 1, flexBasis: anchoDeFiltro }}>
            <Field label="Hasta">
              <Input
                value={hasta}
                onChangeText={(texto) => setHasta(formatearFecha(texto))}
                placeholder="AAAA-MM-DD"
                autoCapitalize="none"
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={10}
              />
            </Field>
          </View>
          <View style={{ flexGrow: 1, flexBasis: anchoDeFiltro }}>
            <Field label="Trámite">
              {tramitesCargando || !!tramitesError ? (
                <Text style={[Type.meta, styles.selectInactivo, { color: C.ink3, borderColor: C.border }]}>
                  {tramitesCargando ? "Cargando trámites…" : "No disponible"}
                </Text>
              ) : (
                <Select value={tramite} options={opcionesDeTramite} onChange={setTramite} />
              )}
            </Field>
          </View>
          <View style={{ flexGrow: 1, flexBasis: anchoDeFiltro }}>
            <Field label="Calificación">
              <Select value={calificacion} options={OPCIONES_DE_CALIFICACION} onChange={setCalificacion} />
            </Field>
          </View>
        </View>

        <View style={[styles.filtrosBotones, mediano ? styles.filtrosBotonesEnLinea : null]}>
          <Btn label="Aplicar filtros" size="md" onPress={aplicarFiltros} disabled={cargando} style={mediano ? null : styles.botonCompleto} />
          <Btn label="Limpiar" variant="secondary" size="md" onPress={limpiarFiltros} disabled={cargando} style={mediano ? null : styles.botonCompleto} />
        </View>

        {(!!errorDeFiltro || !!tramitesError) && (
          <Text style={[Type.meta, { color: C.bad }]} accessibilityRole="alert">
            {errorDeFiltro || `Filtro de trámites: ${tramitesError}`}
          </Text>
        )}
      </View>

      <View style={styles.estado}>
        <Text style={[Type.meta, { color: C.ink2, flexShrink: 1 }]} accessibilityLiveRegion="polite">
          {estado}
        </Text>
        <Btn
          label={cargando ? "Cargando…" : "Actualizar datos"}
          icon="sync"
          variant="ghost"
          size="md"
          onPress={() => pedirDeNuevo({ version: pedido.version + 1 })}
          disabled={cargando}
        />
      </View>

      {!!error && (
        <View style={[styles.alerta, { backgroundColor: C.badBg, borderColor: C.bad }]} accessibilityRole="alert">
          <Text style={[Type.meta, { color: C.bad }]}>{error}</Text>
        </View>
      )}

      <View style={styles.metricas}>
        <Metrica etiqueta="Valoraciones" valor={cifra(resumen?.total)} detalle="Total con los filtros aplicados" ancho={anchoDeMetrica} />
        <Metrica etiqueta="Respuestas útiles" valor={cifra(resumen?.utiles)} detalle="Calificaciones positivas" ancho={anchoDeMetrica} />
        <Metrica etiqueta="Respuestas no útiles" valor={cifra(resumen?.noUtiles)} detalle="Calificaciones negativas" ancho={anchoDeMetrica} />
        <Metrica
          etiqueta="Satisfacción"
          valor={cargando || !resumen ? "—" : satisfaccion}
          detalle="Porcentaje de respuestas útiles"
          ancho={anchoDeMetrica}
        />
      </View>

      {!cargando && !error && !!resumen && !!reporte && (
        <>
          <View style={[styles.desgloses, ancho ? styles.desglosesEnLinea : null]}>
            <Desglose
              titulo="Motivos de respuestas no útiles"
              filas={motivos}
              vacio="Todavía no hay motivos para mostrar."
              ancho={ancho}
            />
            <Desglose
              titulo="Consultas por tópico"
              filas={topicos}
              vacio="Todavía no hay tópicos registrados."
              ancho={ancho}
            />
          </View>

          <View style={[styles.tarjeta, styles.opiniones, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={[styles.opinionesCabecera, { borderBottomColor: C.border }]}>
              <View style={styles.opinionesTitulo}>
                <Text style={[Type.cardTitle, { color: C.ink }]}>Opiniones de la ciudadanía</Text>
                <Text style={[Type.meta, { color: C.ink2 }]}>
                  El resumen incluye todas las coincidencias, no solo esta página.
                </Text>
              </View>
              <View style={styles.porPagina}>
                <Text style={[Type.meta, { color: C.ink2 }]}>Por página</Text>
                <View style={styles.porPaginaSelect}>
                  <Select
                    value={String(pedido.limit) as PorPagina}
                    options={OPCIONES_POR_PAGINA}
                    onChange={(valor) => pedirDeNuevo({ limit: Number(valor), page: 1 })}
                  />
                </View>
              </View>
            </View>

            {reporte.items.length === 0 ? (
              <Text style={[Type.meta, styles.sinResultados, { color: C.ink3 }]}>
                No hay calificaciones para los filtros seleccionados.
              </Text>
            ) : (
              reporte.items.map((item, i) => {
                const abierta = abiertas.includes(item.id);
                const fecha = item.fecha ? formatDateTime(new Date(item.fecha)) : "";
                return (
                  <View
                    key={item.id}
                    style={[styles.opinion, i > 0 ? { borderTopWidth: 1, borderTopColor: C.border } : null]}
                  >
                    <View style={styles.opinionCabecera}>
                      <Text style={[Type.meta, { color: C.ink3 }]}>{fecha || "Fecha no disponible"}</Text>
                      <Badge
                        label={item.calificacion === 1 ? "Útil" : "No útil"}
                        tone={item.calificacion === 1 ? "ok" : "bad"}
                      />
                    </View>
                    <Text style={[Type.bodyStrong, { color: C.ink }]}>{item.textoConsulta || "Consulta sin texto"}</Text>
                    {!!item.respuesta && (
                      <>
                        <Pressable
                          onPress={() => alternarRespuesta(item.id)}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: abierta }}
                          style={styles.verRespuesta}
                        >
                          <Icon name={abierta ? "chevronDown" : "chevronRight"} size={18} color={C.accentText} />
                          <Text style={[Type.metaStrong, { color: C.accentText }]}>
                            {abierta ? "Ocultar respuesta" : "Ver respuesta"}
                          </Text>
                        </Pressable>
                        {abierta && <Text style={[Type.meta, { color: C.ink2 }]}>{item.respuesta}</Text>}
                      </>
                    )}
                    {(!!item.motivoCalificacion || !!item.topico || item.tramiteId != null) && (
                      <View style={styles.opinionDatos}>
                        {!!item.motivoCalificacion && (
                          <Text style={[Type.meta, { color: C.ink3 }]}>{`Motivo: ${item.motivoCalificacion}`}</Text>
                        )}
                        {!!item.topico && <Text style={[Type.meta, { color: C.ink3 }]}>{`Tópico: ${item.topico}`}</Text>}
                        {item.tramiteId != null && (
                          <Text style={[Type.meta, { color: C.ink3 }]}>{`Trámite #${item.tramiteId}`}</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}

            <View style={[styles.paginado, { borderTopColor: C.border }]}>
              <Text style={[Type.meta, { color: C.ink2 }]}>{`Página ${pedido.page} de ${paginas}`}</Text>
              <View style={styles.paginadoBotones}>
                <Btn
                  label="Anterior"
                  variant="secondary"
                  size="md"
                  onPress={() => pedirDeNuevo({ page: Math.max(1, pedido.page - 1) })}
                  disabled={cargando || pedido.page <= 1}
                />
                <Btn
                  label="Siguiente"
                  variant="secondary"
                  size="md"
                  onPress={() => pedirDeNuevo({ page: Math.min(paginas, pedido.page + 1) })}
                  disabled={cargando || pedido.page >= paginas}
                />
              </View>
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  filtros: {
    gap: Spacing[4],
    padding: Spacing[5],
  },
  filtrosCampos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[4],
  },
  filtrosBotones: {
    gap: Spacing[2],
  },
  filtrosBotonesEnLinea: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  botonCompleto: {
    alignSelf: "stretch",
  },
  selectInactivo: {
    minHeight: 56,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderWidth: 1,
    borderRadius: Radius.xl,
  },
  estado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  alerta: {
    marginTop: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  metricas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  metrica: {
    flexGrow: 1,
    gap: Spacing[1],
    padding: Spacing[5],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  desgloses: {
    gap: Spacing[4],
    marginTop: Spacing[5],
  },
  desglosesEnLinea: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  mitad: {
    flex: 1,
    minWidth: 0,
  },
  desglose: {
    gap: Spacing[4],
    padding: Spacing[5],
  },
  desgloseFila: {
    gap: Spacing[1],
  },
  desgloseTexto: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing[3],
  },
  pista: {
    height: 8,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  relleno: {
    height: "100%",
    borderRadius: Radius.full,
  },
  opiniones: {
    marginTop: Spacing[8],
    overflow: "hidden",
  },
  opinionesCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing[3],
    padding: Spacing[5],
    borderBottomWidth: 1,
  },
  opinionesTitulo: {
    flexShrink: 1,
    gap: Spacing[1],
  },
  porPagina: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  porPaginaSelect: {
    width: 110,
  },
  sinResultados: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[10],
    textAlign: "center",
  },
  opinion: {
    gap: Spacing[2],
    padding: Spacing[5],
  },
  opinionCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing[2],
  },
  verRespuesta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing[1],
    minHeight: 44,
  },
  opinionDatos: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: Spacing[4],
    rowGap: Spacing[1],
  },
  paginado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing[3],
    padding: Spacing[5],
    borderTopWidth: 1,
  },
  paginadoBotones: {
    flexDirection: "row",
    gap: Spacing[2],
  },
});
