import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { toneColor, type Tone } from "./Badge";
import { CountUp } from "./CountUp";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/compartido/constantes/theme";

export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
  hint,
  style,
}: {
  label: string;
  value: number | null;
  icon?: IconName;
  tone?: Tone;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const C = useColors();
  const color = toneColor(C, tone);

  return (
    <View
      style={[
        styles.stat,
        {
          backgroundColor: C.surface,
          borderColor: C.border,
        },
        style,
      ]}
    >
      {value === null ? (
        <Text style={[Type.figure, { color: C.ink }]}>—</Text>
      ) : (
        <CountUp value={value} style={[Type.figure, { color: C.ink }]} />
      )}
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
