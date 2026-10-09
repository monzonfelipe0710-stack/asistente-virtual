import { useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BottomSheet } from "./BottomSheet";
import { Text } from "./Text";
import { Radius, Size, Spacing, Weight, useColors } from "@/constants/theme";

/**
 * Desplegable. React Native no tiene `<select>`: el valor se ve como un campo
 * relleno y las opciones salen en una hoja inferior.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  placeholder = "Seleccionar…",
}: {
  value: T | "";
  options: readonly T[];
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const C = useColors();
  const [open, setOpen] = useState(false);

  function choose(option: T) {
    onChange(option);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value || placeholder}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: pressed ? C.surface2 : C.surface },
        ]}
      >
        <Text style={[styles.value, { color: value ? C.ink : C.ink3 }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={C.ink3} />
      </Pressable>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {options.map((option) => {
            const selected = option === value;
            return (
              <Pressable
                key={option}
                onPress={() => choose(option)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.option,
                  { borderBottomColor: C.border, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: C.ink, fontWeight: selected ? Weight.semibold : Weight.normal },
                  ]}
                >
                  {option}
                </Text>
                {selected && <Ionicons name="checkmark" size={20} color={C.accent} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[2],
    height: Size.input,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[4],
  },
  value: {
    fontSize: 16,
    flexShrink: 1,
  },
  list: {
    maxHeight: 420,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[3],
    minHeight: Size.input,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    flexShrink: 1,
  },
});
