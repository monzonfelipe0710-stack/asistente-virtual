import { useState } from "react";
import { StyleSheet, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text, TextInput } from "./Text";
import { Radius, Size, Spacing, Type, useColors } from "@/constants/theme";

/**
 * Campo de texto relleno: 52 de alto, radio 16, gris de superficie. Al
 * enfocarlo, borde azul, anillo de 4 px y fondo blanco.
 * Con `icon` es el buscador: 44 de alto, radio 12, lupa a la izquierda, sin anillo.
 */
export function Input({
  icon,
  invalid = false,
  style,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps & { icon?: keyof typeof Ionicons.glyphMap; invalid?: boolean }) {
  const C = useColors();
  const [focused, setFocused] = useState(false);

  if (icon) {
    return (
      <View style={[styles.search, { backgroundColor: C.surface }]}>
        <Ionicons name={icon} size={18} color={C.ink3} />
        <TextInput
          placeholderTextColor={C.ink3}
          style={[styles.searchText, { color: C.ink }, style]}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />
      </View>
    );
  }

  // React Native no tiene box-shadow con spread: el anillo de foco es un borde
  // de 4 px por fuera del campo.
  return (
    <View style={[styles.ring, { borderColor: focused ? C.ring : "transparent" }]}>
      <TextInput
        placeholderTextColor={C.ink3}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.field,
          multiline && styles.multiline,
          {
            backgroundColor: focused ? C.canvas : C.surface,
            borderColor: invalid ? C.danger : focused ? C.accent : "transparent",
            color: C.ink,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

/** Etiqueta 13/500 arriba, el campo en medio y el error en rojo abajo. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const C = useColors();
  return (
    <View style={styles.fieldBox}>
      <Text style={[Type.metaStrong, { color: C.ink2 }]}>{label}</Text>
      {!!hint && <Text style={[Type.meta, styles.hint, { color: C.ink3 }]}>{hint}</Text>}
      {children}
      {!!error && (
        <Text style={[Type.meta, { color: C.danger }]} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    margin: -4,
    borderWidth: 4,
    borderRadius: Radius.xl + 4,
  },
  field: {
    minHeight: Size.input,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing[4],
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    lineHeight: 23,
    textAlignVertical: "top",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    height: Size.touch,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
  },
  searchText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    height: Size.touch,
  },
  fieldBox: {
    gap: Spacing[2],
  },
  hint: {
    marginTop: -4,
  },
});
