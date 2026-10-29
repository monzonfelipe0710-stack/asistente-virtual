import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { DonutChart, type Segment } from "@/components/reportes/DonutChart";
import { HBarRow } from "@/components/reportes/HBarRow";
import { RankRow } from "@/components/reportes/RankRow";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { useCuentas } from "@/hooks/useCuentas";
import { useMetricas } from "@/hooks/useMetricas";
import { useTramites } from "@/hooks/useTramites";
import { rolesDePersonal } from "@/lib/auth";
import { formatDate } from "@/utils/date";
import { Screen } from "@/components/ui/Screen";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CountUp } from "@/components/ui/CountUp";
import { StatCard } from "@/components/ui/StatCard";
import { StatGrid } from "@/components/ui/StatGrid";

export default function Reportes() {
  const C = useColors();
  const { cuentas } = useCuentas();
  const { tramites } = useTramites();
  const { porTramite, sinRespuesta, error: errorMetricas } = useMetricas();

  const stats = useMemo(() => {
    const activeUsers = cuentas.filter((u) => (u.status ?? "Activo") === "Activo").length;

    return {
      activeUsers,
      inactiveUsers: cuentas.length - activeUsers,
      consultasRespondidas: porTramite.reduce((suma, t) => suma + t.cantidad, 0),
      usersByRole: rolesDePersonal.map((r) => ({
        label: r,
        count: cuentas.filter((u) => u.role === r).length,
      })),
      topTramites: porTramite.slice(0, 5),
    };
  }, [cuentas, porTramite]);

  const tramitesAceptados = tramites.filter((t) => t.publicado).length;
  const tramiteSegments: Segment[] = [
    { label: "Aceptados", value: tramitesAceptados, color: C.ok },
    { label: "Rechazados", value: tramites.length - tramitesAceptados, color: C.bad },
  ];

  const maxRole = Math.max(...stats.usersByRole.map((r) => r.count), 1);
  const activePct = cuentas.length ? Math.round((stats.activeUsers / cuentas.length) * 100) : 0;

  return (
    <Screen>
      <PageHeader
        title="Reportes"
        description="Métricas del sistema y del contenido."
      />

      {!!errorMetricas && (
        <Text style={[Type.meta, { color: C.danger, marginBottom: Spacing[3] }]}>{errorMetricas}</Text>
      )}

      <StatGrid>
        <StatCard
          label="Consultas respondidas"
          value={stats.consultasRespondidas}
          hint="en el asistente"
          icon="eye"
          tone="info"
        />
        <StatCard
          label="Sin respuesta"
          value={sinRespuesta.length}
          hint="últimas consultas"
          icon="bulb"
          tone="brand"
        />
        <StatCard
          label="Trámites"
          value={tramites.length}
          hint="en el sistema"
          icon="files"
          tone="warn"
        />
        <StatCard
          label="Publicados"
          value={tramitesAceptados}
          hint="visibles al público"
          icon="download"
          tone="ok"
        />
      </StatGrid>

      <SectionTitle>Gráficos</SectionTitle>

      <View style={styles.block}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Revisión de trámites</Text>
        <Text style={[styles.cardSub, { color: C.ink2 }]}>
          Trámites aceptados y rechazados por el Administrador
        </Text>
        <View style={{ marginTop: Spacing[4] }}>
          <DonutChart segments={tramiteSegments} />
        </View>
      </View>

      <View style={[styles.block, styles.blockNext, { gap: Spacing[3] }]}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>Usuarios por rol</Text>
        {stats.usersByRole.map((r) => (
          <HBarRow
            key={r.label}
            label={r.label}
            value={r.count}
            max={maxRole}
            color={C.info}
          />
        ))}
      </View>

      <View style={[styles.block, styles.blockNext]}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>
          Distribución de usuarios
        </Text>
        <View style={[styles.splitBar, { backgroundColor: C.surface }]}>
          <View style={{ width: `${activePct}%`, backgroundColor: C.ok }} />
          <View style={{ width: `${100 - activePct}%`, backgroundColor: C.border }} />
        </View>
        <View style={styles.splitLegend}>
          <View style={styles.splitCell}>
            <View style={[styles.legendDot, { backgroundColor: C.ok }]} />
            <View>
              <CountUp
                value={stats.activeUsers}
                style={[styles.splitValue, { color: C.ink }]}
              />
              <Text style={[styles.splitLabel, { color: C.ink2 }]}>
                Activos · {activePct}%
              </Text>
            </View>
          </View>
          <View style={styles.splitCell}>
            <View style={[styles.legendDot, { backgroundColor: C.border }]} />
            <View>
              <CountUp
                value={stats.inactiveUsers}
                style={[styles.splitValue, { color: C.ink }]}
              />
              <Text style={[styles.splitLabel, { color: C.ink2 }]}>
                Suspendidos · {100 - activePct}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      <SectionTitle>Lo más solicitado</SectionTitle>

      <View style={[styles.block, { gap: Spacing[2] }]}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>
          Preguntas más frecuentes
        </Text>
        {stats.topTramites.map((t, i) => (
          <RankRow
            key={t.tramiteId}
            index={i}
            title={t.nombre ?? `Trámite #${t.tramiteId}`}
            subtitle={`${t.sector?.nombre ?? "Sin sector"} · ${t.cantidad} consultas`}
            value={t.cantidad}
          />
        ))}
        {stats.topTramites.length === 0 && (
          <Text style={[Type.meta, { color: C.ink2 }]}>Todavía no hay consultas respondidas.</Text>
        )}
      </View>

      <View style={[styles.block, styles.blockNext, { gap: Spacing[2] }]}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>
          Consultas sin respuesta
        </Text>
        {sinRespuesta.slice(0, 10).map((c) => (
          <View key={c.id} style={styles.consultaSin}>
            <Text style={[Type.body, { color: C.ink }]}>{c.textoConsulta}</Text>
            <Text style={[Type.meta, { color: C.ink2 }]}>{formatDate(c.fecha)}</Text>
          </View>
        ))}
        {sinRespuesta.length === 0 && (
          <Text style={[Type.meta, { color: C.ink2 }]}>No hay consultas sin respuesta.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: Spacing[2],
  },
  blockNext: {
    marginTop: Spacing[3],
  },
  consultaSin: {
    gap: 2,
    paddingVertical: Spacing[2],
  },
  splitBar: {
    flexDirection: "row",
    height: 20,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginTop: Spacing[4],
  },
  splitLegend: {
    flexDirection: "row",
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  splitCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  splitValue: {
    fontSize: 17,
    fontWeight: Weight.semibold,
  },
  splitLabel: {
    ...Type.meta,
    marginTop: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  cardSub: {
    ...Type.meta,
    marginTop: 2,
  },
});
