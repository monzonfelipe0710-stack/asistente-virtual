import { useRouter } from "expo-router";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Screen } from "@/components/ui/Screen";
import { StatCard } from "@/components/ui/StatCard";
import { StatGrid } from "@/components/ui/StatGrid";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCuentas } from "@/hooks/useCuentas";
import { useMetricas } from "@/hooks/useMetricas";
import { usePermisos } from "@/hooks/usePermisos";
import { useTramites } from "@/hooks/useTramites";
import { formatDate } from "@/utils/date";

function Seccion({
  titulo,
  detalle,
  children,
}: {
  titulo: string;
  detalle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const C = useColors();
  return (
    <View style={[styles.seccion, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={[styles.seccionCabecera, { borderBottomColor: C.border }]}>
        <Text style={[Type.cardTitle, { color: C.ink, flexShrink: 1 }]}>{titulo}</Text>
        {typeof detalle === "string" ? (
          <Text style={[Type.overline, { color: C.ink3 }]}>{detalle}</Text>
        ) : (
          detalle
        )}
      </View>
      {children}
    </View>
  );
}

function Vacio({ texto }: { texto: string }) {
  const C = useColors();
  return <Text style={[Type.meta, styles.vacio, { color: C.ink3 }]}>{texto}</Text>;
}

export default function Resumen() {
  const C = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, userRole } = useAuth();
  const { can } = usePermisos();
  const esSuper = userRole === "Administración";
  const nombre = (user?.name || "").split(" ")[0] || "Admin";
  const ancho = width >= 1024;
  const mediano = width >= 640;

  const tramitesHook = useTramites();
  const cuentasHook = useCuentas();
  const metricasHook = useMetricas();

  const tramites = tramitesHook.tramites;
  const cargando =
    tramitesHook.cargando || (esSuper && (metricasHook.cargando || cuentasHook.cargando));
  const metricasPendientes = esSuper && !metricasHook.cargando && !!metricasHook.error;
  const usuariosNoDisponibles = esSuper && !cuentasHook.cargando && !!cuentasHook.error;

  function actualizar() {
    tramitesHook.recargar();
    if (esSuper) {
      metricasHook.recargar();
      cuentasHook.recargar();
    }
  }

  const publicados = tramites.filter((t) => t.publicado).length;
  const misTramites = tramites.filter((t) => String(t.encargado?.id) === user?.id);
  const misPublicados = misTramites.filter((t) => t.publicado).length;

  let totalConsultas = 0;
  for (const r of metricasHook.porTramite) {
    totalConsultas = totalConsultas + r.cantidad;
  }

  const aprobados = cuentasHook.usuarios.filter((u) => u.status === "Activo").length;
  const pendientes = cuentasHook.usuarios.filter((u) => u.status === "Pendiente").length;

  const topConsultados = [...metricasHook.porTramite]
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 6);
  const maxConsulta = topConsultados.length > 0 && topConsultados[0].cantidad > 0 ? topConsultados[0].cantidad : 1;

  const sinRespuestaRecientes = metricasHook.sinRespuesta.slice(0, 6);

  const recientes = [...tramites]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const anchoDeTarjeta = ancho ? { flexBasis: "22%" as const } : undefined;

  const accesos: { titulo: string; icono: "files" | "box" | "checkCircle"; ruta: "/admin/tramites" | "/admin/mesa-de-entrada" | "/admin/solicitudes" }[] = [];
  if (can("tramites")) accesos.push({ titulo: "Trámites", icono: "files", ruta: "/admin/tramites" });
  if (can("solicitudes")) accesos.push({ titulo: "Solicitudes", icono: "checkCircle", ruta: "/admin/solicitudes" });
  if (can("mesa_entrada")) accesos.push({ titulo: "Mesa de Entradas", icono: "box", ruta: "/admin/mesa-de-entrada" });

  const rutaDeTodos = can("tramites") ? "/admin/tramites" : "/admin/solicitudes";

  return (
    <Screen>
      <PageHeader
        title="Resumen"
        description={
          esSuper
            ? `Hola, ${nombre}. Resumen de trámites, consultas del chat y cuentas de la plataforma.`
            : `Hola, ${nombre}. Resumen de tus trámites y la actividad del panel.`
        }
      >
        {accesos.map((a) => (
          <Btn
            key={a.ruta}
            label={a.titulo}
            icon={a.icono}
            variant="secondary"
            size="md"
            onPress={() => router.push(a.ruta)}
          />
        ))}
        <Btn
          label={cargando ? "Actualizando…" : "Actualizar panel"}
          icon="sync"
          variant="ghost"
          size="md"
          onPress={actualizar}
          disabled={cargando}
        />
      </PageHeader>

      {(!!tramitesHook.error || metricasPendientes || usuariosNoDisponibles) && (
        <View
          style={[styles.alerta, { backgroundColor: C.badBg, borderColor: C.bad }]}
          accessibilityRole="alert"
        >
          {!!tramitesHook.error && <Text style={[Type.meta, { color: C.bad }]}>{tramitesHook.error}</Text>}
          {metricasPendientes && (
            <Text style={[Type.meta, { color: C.bad }]}>
              No se pudieron actualizar todas las métricas del chat. Los indicadores afectados no se muestran como cero.
            </Text>
          )}
          {usuariosNoDisponibles && (
            <Text style={[Type.meta, { color: C.bad }]}>No se pudo consultar el estado de las cuentas de usuario.</Text>
          )}
        </View>
      )}

      <StatGrid>
        {esSuper ? (
          <>
            <StatCard
              label="Trámites publicados"
              value={cargando ? null : publicados}
              icon="files"
              tone="ok"
              hint={cargando ? "Cargando…" : `de ${tramites.length} en total`}
              style={anchoDeTarjeta}
            />
            <StatCard
              label="Consultas registradas"
              value={cargando || metricasPendientes ? null : totalConsultas}
              icon="chat"
              tone="info"
              hint={cargando ? "Cargando…" : metricasPendientes ? "Dato no disponible" : "agrupadas por trámite"}
              style={anchoDeTarjeta}
            />
            <StatCard
              label="Consultas sin respuesta"
              value={cargando || metricasPendientes ? null : metricasHook.sinRespuesta.length}
              icon="bulb"
              tone="warn"
              hint={cargando ? "Cargando…" : metricasPendientes ? "Dato no disponible" : "registros recientes (máximo 50)"}
              style={anchoDeTarjeta}
            />
            <StatCard
              label="Usuarios aprobados"
              value={cargando || usuariosNoDisponibles ? null : aprobados}
              icon="users"
              tone="brand"
              hint={cargando ? "Cargando…" : usuariosNoDisponibles ? "Dato no disponible" : `${pendientes} pendientes`}
              style={anchoDeTarjeta}
            />
          </>
        ) : (
          <>
            <StatCard
              label="Mis trámites"
              value={cargando ? null : misTramites.length}
              icon="files"
              tone="brand"
              hint={cargando ? "Cargando…" : `de ${tramites.length} en el sistema`}
              style={anchoDeTarjeta}
            />
            <StatCard
              label="Publicados"
              value={cargando ? null : misPublicados}
              icon="checkCircle"
              tone="ok"
              hint="visibles en el chat"
              style={anchoDeTarjeta}
            />
            <StatCard
              label="Borradores"
              value={cargando ? null : misTramites.length - misPublicados}
              icon="edit"
              tone="muted"
              hint="aún sin publicar"
              style={anchoDeTarjeta}
            />
            <StatCard
              label="Trámites totales"
              value={cargando ? null : tramites.length}
              icon="folder"
              tone="info"
              hint="en toda la plataforma"
              style={anchoDeTarjeta}
            />
          </>
        )}
      </StatGrid>

      {!esSuper && (
        <View style={[styles.aviso, { backgroundColor: C.infoBg, borderColor: C.info }]}>
          <Icon name="info" size={22} color={C.info} />
          <View style={styles.avisoTexto}>
            <Text style={[Type.bodyStrong, { color: C.ink }]}>Métricas de actividad no disponibles para este rol</Text>
            <Text style={[Type.meta, { color: C.ink2 }]}>
              Las métricas detalladas solo están habilitadas para Administración. Podés seguir gestionando tus trámites desde la sección correspondiente.
            </Text>
          </View>
        </View>
      )}

      {esSuper && !cargando && (
        <>
          <Seccion titulo="Trámites más consultados" detalle={metricasPendientes ? "No disponible" : "Chat"}>
            {metricasPendientes ? (
              <Vacio texto="No se pudieron cargar las métricas del chat." />
            ) : topConsultados.length === 0 ? (
              <Vacio texto="Todavía no hay consultas registradas." />
            ) : (
              <View style={styles.barras}>
                {topConsultados.map((c) => {
                  const nombreTramite = c.nombre || (c.tramiteId == null ? "Trámite eliminado" : `Trámite #${c.tramiteId}`);
                  const porcentaje = Math.max(4, (c.cantidad / maxConsulta) * 100);
                  return (
                    <View key={c.tramiteId ?? "sin-tramite"} style={mediano ? styles.barraFila : styles.barraColumna}>
                      <Text
                        style={[Type.meta, { color: C.ink }, mediano ? styles.barraNombre : null]}
                        numberOfLines={mediano ? 1 : 2}
                      >
                        {nombreTramite}
                      </Text>
                      <View style={styles.barraDatos}>
                        <View style={[styles.barraPista, { backgroundColor: C.surface2 }]}>
                          <View style={[styles.barraRelleno, { width: `${porcentaje}%`, backgroundColor: C.accent }]} />
                        </View>
                        <Text style={[Type.metaStrong, styles.barraValor, { color: C.ink }]}>{c.cantidad}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Seccion>

          <Seccion titulo="Consultas sin respuesta" detalle={`${sinRespuestaRecientes.length} de hasta 50`}>
            {sinRespuestaRecientes.length === 0 ? (
              <Vacio texto="No hay consultas sin respuesta." />
            ) : (
              sinRespuestaRecientes.map((c, i) => (
                <View
                  key={c.id}
                  style={[
                    styles.fila,
                    mediano ? styles.filaEnLinea : null,
                    i > 0 ? { borderTopWidth: 1, borderTopColor: C.border } : null,
                  ]}
                >
                  <Text style={[Type.body, { color: C.ink, flexShrink: 1 }]}>
                    {c.textoConsulta || "Consulta sin texto disponible"}
                  </Text>
                  <Text style={[Type.meta, { color: C.ink3 }]}>{formatDate(c.fecha)}</Text>
                </View>
              ))
            )}
          </Seccion>
        </>
      )}

      <Seccion
        titulo="Trámites recientes"
        detalle={<Btn label="Ver todos" variant="ghost" size="md" onPress={() => router.push(rutaDeTodos)} />}
      >
        {cargando ? (
          <Vacio texto="Cargando trámites…" />
        ) : recientes.length === 0 ? (
          <Vacio texto="Todavía no hay trámites cargados." />
        ) : (
          <>
            {ancho && (
              <View style={[styles.fila, styles.filaEnLinea, styles.encabezadoTabla]}>
                <Text style={[Type.overline, styles.colNombre, { color: C.ink3 }]}>Trámite</Text>
                <Text style={[Type.overline, styles.colDato, { color: C.ink3 }]}>Sector</Text>
                <Text style={[Type.overline, styles.colDato, { color: C.ink3 }]}>Encargado</Text>
                <Text style={[Type.overline, styles.colEstado, { color: C.ink3 }]}>Estado</Text>
                <Text style={[Type.overline, styles.colFecha, { color: C.ink3 }]}>Actualizado</Text>
              </View>
            )}
            {recientes.map((t, i) => {
              const sector = t.sector?.nombre || "—";
              const encargado = t.encargado?.nombre || "—";
              const estado = (
                <Badge label={t.publicado ? "Publicado" : "Borrador"} tone={t.publicado ? "ok" : "muted"} />
              );
              const borde = i > 0 || ancho ? { borderTopWidth: 1, borderTopColor: C.border } : null;

              if (ancho) {
                return (
                  <View key={t.id} style={[styles.fila, styles.filaEnLinea, borde]}>
                    <Text style={[Type.rowTitle, styles.colNombre, { color: C.ink }]} numberOfLines={2}>
                      {t.nombre}
                    </Text>
                    <Text style={[Type.meta, styles.colDato, { color: C.ink2 }]} numberOfLines={2}>
                      {sector}
                    </Text>
                    <Text style={[Type.meta, styles.colDato, { color: C.ink2 }]} numberOfLines={2}>
                      {encargado}
                    </Text>
                    <View style={styles.colEstado}>{estado}</View>
                    <Text style={[Type.meta, styles.colFecha, { color: C.ink3 }]}>{formatDate(t.updatedAt)}</Text>
                  </View>
                );
              }

              return (
                <View key={t.id} style={[styles.fila, borde]}>
                  <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={2}>
                    {t.nombre}
                  </Text>
                  <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
                    {`${sector} · ${encargado}`}
                  </Text>
                  <View style={styles.etiquetas}>
                    {estado}
                    <Text style={[Type.meta, { color: C.ink3 }]}>{formatDate(t.updatedAt)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Seccion>
    </Screen>
  );
}

const styles = StyleSheet.create({
  alerta: {
    gap: Spacing[1],
    marginBottom: Spacing[4],
    padding: Spacing[4],
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  aviso: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
    marginTop: Spacing[8],
    padding: Spacing[4],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  avisoTexto: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  seccion: {
    marginTop: Spacing[8],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
  seccionCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing[3],
    minHeight: 64,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  vacio: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[8],
  },
  barras: {
    gap: Spacing[4],
    padding: Spacing[5],
  },
  barraFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
  },
  barraColumna: {
    gap: Spacing[2],
  },
  barraNombre: {
    width: 220,
  },
  barraDatos: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  barraPista: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    borderRadius: Radius.full,
  },
  barraValor: {
    minWidth: 32,
    textAlign: "right",
    fontWeight: Weight.bold,
  },
  fila: {
    gap: Spacing[1],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  filaEnLinea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[4],
  },
  encabezadoTabla: {
    paddingVertical: Spacing[3],
  },
  etiquetas: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  colNombre: {
    flex: 2,
    minWidth: 0,
  },
  colDato: {
    flex: 1,
    minWidth: 0,
  },
  colEstado: {
    width: 130,
  },
  colFecha: {
    width: 120,
  },
});
