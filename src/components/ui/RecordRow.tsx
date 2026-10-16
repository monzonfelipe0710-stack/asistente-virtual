import { StyleSheet, View } from "react-native";

import { Badge, type Tone } from "./Badge";
import { Icon } from "./Icon";
import { Row } from "./Row";
import { Text } from "./Text";
import { Radius, Spacing, Type, useColors } from "@/constants/theme";

type Estado = "Ingresado" | "En proceso" | "Observado" | "Finalizado";
type Prioridad = "Alta" | "Normal" | "Baja";

const STATUS_TONE: Record<Estado, Tone> = {
  Ingresado: "info",
  "En proceso": "muted",
  Observado: "warn",
  Finalizado: "ok",
};

/**
 * Fila de expediente: título, solicitante y área, la etiqueta de estado con el
 * número y la fecha en mono, la prioridad, una nota debajo y la flecha a la derecha.
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
  status: Estado;
  who: string;
  area: string;
  priority: Prioridad;
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
      <View style={styles.fila}>
        <View style={styles.cuerpo}>
          <Text style={[Type.rowTitle, { color: C.ink }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[Type.meta, { color: C.ink2 }]} numberOfLines={1}>
            {who} · {area}
          </Text>

          <View style={styles.data}>
            <Badge label={status} tone={STATUS_TONE[status]} />
            <Text style={[Type.mono, { color: C.ink2 }]}>{id}</Text>
            <Text style={[Type.mono, { color: C.ink2 }]}>{date}</Text>
            <View style={styles.priority}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={[Type.meta, { color: C.ink2 }]}>{priority}</Text>
            </View>
            {extra}
          </View>

          {!!note && (
            <Text style={[Type.meta, { color: C.ink3 }]} numberOfLines={2}>
              {note}
            </Text>
          )}
        </View>
        {!!onPress && <Icon name="chevronRight" size={20} color={C.ink2} />}
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  cuerpo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  data: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: 6,
  },
  priority: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
});
