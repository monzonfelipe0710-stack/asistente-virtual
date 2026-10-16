import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Radius, Spacing, Weight, useColors } from "@/constants/theme";

/**
 * Opciones en grilla de 2 columnas (separación 8): cada una es un botón de 52
 * con radio 16. La elegida va en azul con borde de 2; las demás, borde fuerte.
 */
export function OptionGrid<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const C = useColors();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {options.map((option) => {
        const checked = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            style={[
              styles.option,
              checked
                ? { backgroundColor: C.accent, borderColor: C.accent, borderWidth: 2 }
                : { backgroundColor: "transparent", borderColor: C.borderStrong },
            ]}
          >
            <Text
              style={[styles.optionText, { color: checked ? C.onAccent : C.ink }]}
              numberOfLines={1}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[2],
  },
  option: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing[2],
  },
  optionText: {
    fontSize: 16,
    fontWeight: Weight.semibold,
    textAlign: "center",
  },
});
