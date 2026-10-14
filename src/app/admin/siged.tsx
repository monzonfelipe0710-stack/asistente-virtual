import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";

import { Radius, Size, Spacing, Type, useColors } from "@/constants/theme";
import { sigedStatuses, type SigedRecord, type SigedStatus } from "@/data/mockSiged";
import { formatDate, formatDateTime, todayISO } from "@/utils/date";
import { Icon } from "@/components/ui/Icon";
import { Tabs } from "@/components/ui/Tabs";
import { useAvisoNoDisponible } from "@/components/ui/AvisoNoDisponible";
import { EmptyState } from "@/components/ui/EmptyState";
import { KeyValue } from "@/components/ui/KeyValue";
import { RecordRow } from "@/components/ui/RecordRow";
import { Screen } from "@/components/ui/Screen";
import { AvisoDeEjemplo } from "@/components/ui/AvisoDeEjemplo";
import { PageHeader } from "@/components/ui/PageHeader";

type Filter = "Todos" | SigedStatus;

export default function SigedIntegration() {
  const C = useColors();
  const avisarNoDisponible = useAvisoNoDisponible();

  const [sigedRecords] = useState<SigedRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<Filter>("Todos");
  const [syncedAt] = useState<Date | null>(null);
  const [syncing] = useState(false);
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!syncing) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      spin.setValue(0);
    };
  }, [syncing, spin]);

  function sync() {
    if (syncing) return;
    avisarNoDisponible();
  }

  const filtered = useMemo(
    () =>
      statusFilter === "Todos"
        ? sigedRecords
        : sigedRecords.filter((r) => r.status === statusFilter),
    [sigedRecords, statusFilter]
  );

  const todayCount = sigedRecords.filter((r) => r.date === todayISO()).length;

  return (
    <Screen>
      <PageHeader
        title="Integración SIGED"
        description="Sistema de Gestión Documental · Mesa de Entradas"
      />

      <AvisoDeEjemplo texto="Los expedientes de abajo son de ejemplo. La sincronización real todavía no está disponible." />

      {/* Estado de la conexión: lo primero que se necesita saber acá */}
      <View style={[styles.syncTop, { borderBottomColor: C.border }]}>
        <View style={styles.statusRow}>
          <View style={[styles.halo, { backgroundColor: C.surface }]}>
            <View style={[styles.dot, { backgroundColor: C.ink3 }]} />
          </View>
          <Text style={[Type.rowTitle, { color: C.ink }]}>API sin conectar</Text>
        </View>
        <Pressable
          onPress={sync}
          accessibilityRole="button"
          accessibilityState={{ busy: syncing }}
          style={({ pressed }) => [
            styles.syncBtn,
            { borderColor: C.border, backgroundColor: pressed ? C.surface : C.canvas },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
              ],
            }}
          >
            <Icon name="sync" size={16} color={C.ink} />
          </Animated.View>
          <Text style={[Type.label, { color: C.ink }]}>
            {syncing ? "Sincronizando" : "Sincronizar"}
          </Text>
        </Pressable>
      </View>

      <KeyValue
        label="Última sincronización"
        value={syncing ? "En curso…" : syncedAt ? formatDateTime(syncedAt) : "Nunca"}
      />
      <KeyValue label="Consultas hoy" value={String(todayCount)} />

      <View style={{ marginTop: Spacing[6] }}>
        <Tabs
          items={[
            { id: "Todos" as Filter, label: "Todos", count: sigedRecords.length },
            ...sigedStatuses.map((status) => ({
              id: status as Filter,
              label: status,
              count: sigedRecords.filter((r) => r.status === status).length,
            })),
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </View>

      <View>
        {filtered.map((rec) => (
          <RecordRow
            key={rec.id}
            title={rec.type}
            status={rec.status}
            who={rec.applicant}
            area={rec.department}
            priority={rec.priority}
            id={rec.id}
            date={formatDate(rec.date)}
            note={rec.lastMovement}
          />
        ))}

        {filtered.length === 0 && <EmptyState title="Sin resultados." />}
      </View>

      <Text style={[Type.meta, { color: C.ink3, marginTop: Spacing[6] }]}>
        Los expedientes ingresados son recibidos y asignados por Mesa de Entradas
        para su procesamiento.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  syncTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[3],
    paddingBottom: Spacing[4],
    borderBottomWidth: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  // el anillo de 4 px alrededor del punto de 10
  halo: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    height: Size.touch,
    paddingHorizontal: Spacing[4],
    borderRadius: 999,
    borderWidth: 1,
  },
});
