import { useRef } from "react";
import { StyleSheet, View, type TextInputProps, type ViewInstance } from "react-native";

import { Icon } from "./Icon";
import { useAvisarFoco } from "./Screen";
import { TextInput } from "./TextInput";
import { Radius, Size, Spacing, useColors } from "@/constants/theme";

/** Buscador: 52 de alto, radio 18, borde fuerte, lupa a la izquierda. */
export function SearchInput({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const C = useColors();
  const caja = useRef<ViewInstance>(null);
  const avisarFoco = useAvisarFoco();

  return (
    <View
      ref={caja}
      style={[styles.search, { backgroundColor: C.canvas, borderColor: C.borderStrong }]}
    >
      <Icon name="search" size={20} color={C.ink3} />
      <TextInput
        placeholderTextColor={C.ink3}
        style={[styles.searchText, { color: C.ink }, style]}
        onFocus={(e) => {
          avisarFoco(caja.current);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          avisarFoco(null);
          onBlur?.(e);
        }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: Radius.button,
    borderWidth: 1.5,
    paddingHorizontal: Spacing[4],
  },
  searchText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    height: Size.touch,
  },
});
