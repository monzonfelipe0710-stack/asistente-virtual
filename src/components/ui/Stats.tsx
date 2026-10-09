import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type StyleProp, type TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { toneColor, type Tone } from "./Badge";
import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/constants/theme";

/** Número que sube hasta su valor: deja ver que se acaba de calcular. */
export function CountUp({
  value,
  duration = 550,
  style,
}: {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
}) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = Date.now();
    let frame = 0;

    function step() {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(from.current + (value - from.current) * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <Text style={style}>{shown}</Text>;
}

/**
 * Indicador sin tarjeta: ícono de 18 en el color del estado con su etiqueta,
 * la cifra 34/40 y una nota debajo.
 */
export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
  hint,
}: {
  label: string;
  value: number;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  hint?: string;
}) {
  const C = useColors();

  return (
    <View style={styles.stat}>
      <View style={styles.top}>
        {!!icon && <Ionicons name={icon} size={18} color={toneColor(C, tone)} />}
        <Text style={[Type.label, styles.label, { color: C.ink2 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <CountUp value={value} style={[Type.figure, styles.figure, { color: C.ink }]} />

      {!!hint && (
        <Text style={[Type.meta, { color: C.ink3 }]} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  );
}

/** Indicadores en 2 × 2: 12 entre columnas y 24 entre filas. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: Spacing[6],
    columnGap: Spacing[3],
  },
  stat: {
    flexGrow: 1,
    flexBasis: "40%",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  label: {
    flex: 1,
    fontWeight: "400",
  },
  figure: {
    marginTop: Spacing[2],
  },
});
