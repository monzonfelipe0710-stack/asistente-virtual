import { StyleSheet, View, type TextInputProps } from "react-native";

import { Icon } from "./Icon";
import { TextInput } from "./TextInput";
import { Radius, Size, Spacing, useColors } from "@/constants/theme";

/** Buscador: 52 de alto, radio 18, borde fuerte, lupa a la izquierda. */
export function SearchInput({ style, ...rest }: TextInputProps) {
  const C = useColors();

  return (
    <View style={[styles.search, { backgroundColor: C.canvas, borderColor: C.borderStrong }]}>
      <Icon name="search" size={20} color={C.ink3} />
      <TextInput
        placeholderTextColor={C.ink3}
        style={[styles.searchText, { color: C.ink }, style]}
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
