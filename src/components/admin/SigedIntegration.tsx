import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Radius, Spacing, Type, useAdminColors } from "../../constants/theme";
import { sigedRecords, sigedStatuses, type SigedStatus } from "../../data/mockSiged";
import { formatDate } from "../../utils/date";
import { useToast } from "../common/Toast";
import {
  AdminScreen,
  Btn,
  Card,
  EmptyState,
  FilterChip,
  KeyValue,
  ListCard,
  PageHeader,
  PriorityDot,
  Row,
  SectionTitle,
  StatusPill,
} from "./ui";

type Filter = "Todos" | SigedStatus;

export default function SigedIntegration() {
  const C = useAdminColors();
  const push = useToast();

  const [statusFilter, setStatusFilter] = useState<Filter>("Todos");
  const [syncedAt, setSyncedAt] = useState(() => new Date());

  const filtered = useMemo(
    () =>
      statusFilter === "Todos"
        ? sigedRecords
        : sigedRecords.filter((r) => r.status === statusFilter),
    [statusFilter]
  );

  const todayCount = sigedRecords.filter((r) => r.date === "2026-06-04").length;

  return (
    <AdminScreen>
      <PageHeader
        title="Integración SIGED"
        description="Sistema de Gestión Documental · Mesa de Entradas"
      />

      {/* Estado de la conexión: lo primero que se necesita saber acá */}
      <Card padded>
        <View style={styles.syncTop}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: C.ok }]} />
            <Text style={[Type.bodyStrong, { color: C.ink }]}>API conectada</Text>
          </View>
          <Btn
            label="Sincronizar"
            variant="ghost"
            icon="sync-outline"
            onPress={() => {
              setSyncedAt(new Date());
              push("Sincronización con SIGED completada.", "success");
            }}
          />
        </View>

        <View style={[styles.syncMeta, { borderTopColor: C.line }]}>
          <KeyValue
            label="Última sincronización"
            value={syncedAt.toLocaleString("es-AR")}
          />
          <KeyValue label="Latencia" value="45 ms · operativa" />
          <KeyValue label="Consultas hoy" value={String(todayCount)} />
        </View>
      </Card>

      {/* Los filtros van sobre la lista, no adentro: se ven aunque se scrollee */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={{ marginTop: Spacing[4] }}
      >
        <FilterChip
          label="Todos"
          count={sigedRecords.length}
          active={statusFilter === "Todos"}
          onPress={() => setStatusFilter("Todos")}
        />
        {sigedStatuses.map((status) => (
          <FilterChip
            key={status}
            label={status}
            count={sigedRecords.filter((r) => r.status === status).length}
            active={statusFilter === status}
            onPress={() => setStatusFilter(status)}
          />
        ))}
      </ScrollView>

      <ListCard style={{ marginTop: Spacing[3] }}>
        {filtered.map((rec, i) => (
          <Row key={rec.id} first={i === 0}>
            <View style={styles.rowTop}>
              <Text style={[Type.bodyStrong, { color: C.ink, flexShrink: 1 }]} numberOfLines={1}>
                {rec.type}
              </Text>
              <StatusPill status={rec.status} />
            </View>

            <Text style={[Type.meta, { color: C.muted, marginTop: 2 }]} numberOfLines={1}>
              {rec.applicant} · {rec.department}
            </Text>

            <View style={styles.rowFoot}>
              <PriorityDot priority={rec.priority} showLabel />
              <Text style={[Type.meta, { color: C.faint }]}>{rec.id}</Text>
              <Text style={[Type.meta, { color: C.faint }]}>{formatDate(rec.date)}</Text>
            </View>

            <Text style={[Type.meta, { color: C.faint, marginTop: 2 }]} numberOfLines={2}>
              {rec.lastMovement}
            </Text>
          </Row>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon="document-text-outline"
            title="Sin expedientes"
            description="No hay expedientes con ese estado."
          />
        )}
      </ListCard>

      <SectionTitle>Cómo funciona</SectionTitle>
      <Card padded>
        <Text style={[Type.body, { color: C.muted }]}>
          Los expedientes ingresados son recibidos y asignados por Mesa de Entradas
          para su procesamiento.
        </Text>
      </Card>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  syncTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing[3],
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  syncMeta: {
    marginTop: Spacing[4],
    paddingTop: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing[2],
  },
  chips: {
    flexDirection: "row",
    gap: Spacing[2],
    paddingRight: Spacing[4],
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[2],
  },
  rowFoot: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
});
