import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Badge, type Tone } from "./Badge";
import { Text } from "./Text";
import type { SigedPriority, SigedStatus } from "@/data/mockSiged";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";

/**
 * Fila de lista: línea de 1 px abajo y 16 de aire arriba y abajo. Si recibe
 * `onPress`, se puede tocar.
 */
export function Row({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const C = useColors();
  const base = [styles.row, { borderBottomColor: C.border }, style];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { backgroundColor: C.surface }]}
    >
      {children}
    </Pressable>
  );
}

const STATUS_TONE: Record<SigedStatus, Tone> = {
  Ingresado: "info",
  "En proceso": "warn",
  Observado: "bad",
  Finalizado: "ok",
};

/**
 * Fila de expediente: título con el estado a la derecha, solicitante y área,
 * prioridad con número y fecha en Geist Mono, y una nota debajo.
 */
export function RecordRow({
  title,
  status,
  who,
  area,
  priority,
  id,
  date,
  note,
  extra,
  onPress,
}: {
  title: string;
  status: SigedStatus;
  who: string;
  area: string;
  priority: SigedPriority;
  id: string;
  date: string;
  note?: string;
  /** Algo más en la línea de datos técnicos, como la cantidad de adjuntos. */
  extra?: React.ReactNode;
  onPress?: () => void;
}) {
  const C = useColors();
  // Alta en rojo, Normal en azul, Baja en gris.
  const priorityColor =
    priority === "Alta" ? C.danger : priority === "Normal" ? C.accent : C.ink3;

  return (
    <Row onPress={onPress} accessibilityLabel={`${title}, ${status}, ${id}`}>
      <View style={styles.top}>
        <Text style={[Type.rowTitle, styles.title, { color: C.ink }]} numberOfLines={2}>
          {title}
        </Text>
        <Badge label={status} tone={STATUS_TONE[status]} />
      </View>

      <Text style={[Type.label, styles.who, { color: C.ink2 }]} numberOfLines={1}>
        {who} · {area}
      </Text>

      <View style={styles.data}>
        <View style={styles.priority}>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
          <Text style={[Type.meta, { color: C.ink2 }]}>{priority}</Text>
        </View>
        <Text style={[Type.mono, { color: C.ink3 }]}>{id}</Text>
        <Text style={[Type.mono, { color: C.ink3 }]}>{date}</Text>
        {extra}
      </View>

      {!!note && (
        <Text style={[Type.meta, styles.note, { color: C.ink3 }]} numberOfLines={2}>
          {note}
        </Text>
      )}
    </Row>
  );
}

/** Par etiqueta / valor en dos columnas iguales, con su línea. */
export function KeyValue({ label, value }: { label: string; value: string }) {
  const C = useColors();
  return (
    <View style={[styles.keyValue, { borderBottomColor: C.border }]}>
      <Text style={[styles.key, { color: C.ink2 }]}>{label}</Text>
      <Text style={[styles.key, styles.keyValueText, { color: C.ink }]}>{value}</Text>
    </View>
  );
}

export function EmptyState({ title = "Sin resultados." }: { title?: string }) {
  const C = useColors();
  return (
    <View style={styles.empty}>
      <Text style={[Type.body, { color: C.ink2, textAlign: "center" }]}>{title}</Text>
    </View>
  );
}

/** Iniciales en un círculo de 40, gris de superficie. */
export function Avatar({ name }: { name: string }) {
  const C = useColors();
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <View style={[styles.avatar, { backgroundColor: C.surface }]}>
      <Text style={[styles.avatarText, { color: C.ink2 }]}>{initials}</Text>
    </View>
  );
}

/** Bloque gris que late mientras se espera. */
function Skeleton({ width, height = 14 }: { width: number | `${number}%`; height?: number }) {
  const C = useColors();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence(
        [1, 0].map((toValue) =>
          Animated.timing(pulse, {
            toValue,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        )
      )
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: Radius.sm,
        backgroundColor: C.surface,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
      }}
    />
  );
}

/** Filas fantasma mientras llegan los datos. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, index) => (
        <Row key={index}>
          <View style={styles.skeletonRow}>
            <Skeleton width={40} height={40} />
            <View style={styles.skeletonText}>
              <Skeleton width="60%" />
              <Skeleton width="35%" height={10} />
            </View>
          </View>
        </Row>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  top: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing[3],
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  who: {
    fontWeight: Weight.normal,
    marginTop: Spacing[1],
  },
  data: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  priority: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },
  note: {
    marginTop: Spacing[1],
  },
  keyValue: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  key: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  keyValueText: {
    fontWeight: Weight.medium,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[10],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: Weight.semibold,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  skeletonText: {
    flex: 1,
    gap: Spacing[2],
  },
});
