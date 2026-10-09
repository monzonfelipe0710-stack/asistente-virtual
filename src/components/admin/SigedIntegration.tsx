import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../common/Text";

import { Radius, Size, Spacing, Type, useAdminColors } from "../../constants/theme";
import { sigedRecords, sigedStatuses, type SigedStatus } from "../../data/mockSiged";
import { formatDate } from "../../utils/date";
import Icon from "../common/Icon";
import Tabs from "../common/Tabs";
import { useToast } from "../common/Toast";
import {
  AdminScreen,
  EmptyState,
  KeyValue,
  ListCard,
  PageHeader,
  RecordRow,
} from "./ui";

type Filter = "Todos" | SigedStatus;

/** Fecha y hora como en el resto del panel: 09/10/2026, 11:57. */
function stamp(d: Date) {
  return `${formatDate(d)}, ${d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

export default function SigedIntegration() {
  const C = useAdminColors();
  const push = useToast();

  const [statusFilter, setStatusFilter] = useState<Filter>("Todos");
  const [syncedAt, setSyncedAt] = useState(() => new Date());
  const [syncing, setSyncing] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function sync() {
    if (syncing) return;
    setSyncing(true);
    timer.current = setTimeout(() => {
      setSyncing(false);
      setSyncedAt(new Date());
      push("Sincronización completa · sin errores");
    }, 1500);
  }

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
      <View style={[styles.syncTop, { borderBottomColor: C.line }]}>
        <View style={styles.statusRow}>
          <View style={[styles.halo, { backgroundColor: C.okBg }]}>
            <View style={[styles.dot, { backgroundColor: C.ok }]} />
          </View>
          <Text style={[Type.rowTitle, { color: C.ink }]}>API conectada</Text>
        </View>
        <Pressable
          onPress={sync}
          accessibilityRole="button"
          accessibilityState={{ busy: syncing }}
          style={({ pressed }) => [
            styles.syncBtn,
            { borderColor: C.line, backgroundColor: pressed ? C.mist : C.canvas },
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
        value={syncing ? "En curso…" : stamp(syncedAt)}
      />
      <KeyValue label="Latencia" value="45 ms · operativa" />
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

      <ListCard>
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
      </ListCard>

      <Text style={[Type.meta, { color: C.faint, marginTop: Spacing[6] }]}>
        Los expedientes ingresados son recibidos y asignados por Mesa de Entradas
        para su procesamiento.
      </Text>
    </AdminScreen>
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
