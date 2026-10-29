import { StyleSheet, View } from "react-native";

import { toneColor, type Tone } from "./Badge";
import { CountUp } from "./CountUp";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";

/**
 * Indicador en tarjeta de superficie (radio 20): cifra 36, etiqueta y una nota
 * del color del estado. Con `ejemplo`, el borde es de rayas: el dato no viene
 * del servidor.
 */
export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
  hint,
  ejemplo = false,
}: {
  label: string;
  value: number;
  icon?: IconName;
  tone?: Tone;
  hint?: string;
  ejemplo?: boolean;
}) {
  const C = useColors();
  const color = toneColor(C, tone);

  return (
    <View
      style={[
        styles.stat,
        {
          backgroundColor: C.surface,
          borderColor: ejemplo ? C.borderStrong : C.border,
          borderStyle: ejemplo ? "dashed" : "solid",
        },
      ]}
    >
      <CountUp value={value} style={[Type.figure, { color: C.ink }]} />
      <View style={styles.top}>
        {!!icon && <Icon name={icon} size={18} color={color} />}
        <Text style={[Type.label, styles.label, { color: C.ink2 }]}>{label}</Text>
      </View>
      {!!hint && <Text style={[styles.hint, { color }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flexGrow: 1,
    flexBasis: "40%",
    gap: 4,
    padding: Spacing[4],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  label: {
    flexShrink: 1,
  },
  hint: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: Weight.semibold,
  },
});
