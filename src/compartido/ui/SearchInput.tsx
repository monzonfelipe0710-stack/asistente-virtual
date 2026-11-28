import { useRef, useState } from "react";
import { StyleSheet, View, type TextInputProps, type ViewInstance } from "react-native";

import { Icon } from "./Icon";
import { useAvisarFoco } from "./Screen";
import { TextInput } from "./TextInput";
import { Radius, Size, Spacing, useColors } from "@/compartido/constantes/theme";

export function SearchInput({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const C = useColors();
  const caja = useRef<ViewInstance>(null);
  const avisarFoco = useAvisarFoco();
  const [enfocado, setEnfocado] = useState(false);

  // El foco se marca como en Input: borde de acento y anillo alrededor.
  return (
    <View style={[styles.anillo, { borderColor: enfocado ? C.ring : "transparent" }]}>
      <View
        ref={caja}
        style={[
          styles.search,
          {
            backgroundColor: C.canvas,
            borderColor: enfocado ? C.accent : C.borderStrong,
            borderWidth: enfocado ? 2 : 1.5,
          },
        ]}
      >
        <Icon name="search" size={20} color={C.ink3} />
        <TextInput
          placeholderTextColor={C.ink3}
          style={[styles.searchText, { color: C.ink }, style]}
          onFocus={(e) => {
            setEnfocado(true);
            avisarFoco(caja.current);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            avisarFoco(null);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anillo: {
    margin: -4,
    borderWidth: 4,
    borderRadius: Radius.button + 4,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing[4],
  },
  searchText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    height: Size.touch,
  },
});
