import { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  type ViewInstance,
  type TextInputProps,
} from "react-native";

import { useAvisarFoco } from "./Screen";
import { TextInput } from "./TextInput";
import { Radius, Size, Spacing, useColors } from "@/compartido/constantes/theme";

export function Input({
  invalid = false,
  style,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps & { invalid?: boolean }) {
  const C = useColors();
  const caja = useRef<ViewInstance>(null);
  const avisarFoco = useAvisarFoco();
  const [focused, setFocused] = useState(false);

  return (
    <View
      ref={caja}
      style={[
        styles.ring,
        { borderColor: focused && !invalid ? C.ring : "transparent" },
      ]}
    >
      <TextInput
        placeholderTextColor={C.ink3}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          avisarFoco(caja.current);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          avisarFoco(null);
          onBlur?.(e);
        }}
        style={[
          styles.field,
          multiline && styles.multiline,
          {
            backgroundColor: C.canvas,
            borderColor: invalid ? C.danger : focused ? C.accent : C.borderStrong,
            borderWidth: invalid || focused ? 2 : 1.5,
            color: C.ink,
          },
          style,
        ]}
        {...rest}
      />
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
    paddingHorizontal: Spacing[4],
    fontSize: 17,
  },
  multiline: {
    minHeight: 112,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    lineHeight: 24,
    textAlignVertical: "top",
  },
});
