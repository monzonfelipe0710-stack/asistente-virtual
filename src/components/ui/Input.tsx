import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type TextInput as RNTextInput,
  type TextInputProps,
} from "react-native";

import { useAvisarFoco } from "./Screen";
import { TextInput } from "./TextInput";
import { Radius, Size, Spacing, useColors } from "@/constants/theme";

/**
 * Campo de texto: 56 de alto, radio 16, fondo del lienzo y borde fuerte. Al
 * enfocarlo, borde azul de 2 y anillo de 4 px; con error, borde rojo de 2.
 *
 * Con `soloAlTocar` el campo no se puede editar hasta que se lo toca: así
 * deslizar la pantalla con el dedo sobre un campo largo no sube el teclado.
 */
export function Input({
  invalid = false,
  soloAlTocar = false,
  style,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps & { invalid?: boolean; soloAlTocar?: boolean }) {
  const C = useColors();
  const campo = useRef<RNTextInput>(null);
  const caja = useRef<View>(null);
  const avisarFoco = useAvisarFoco();
  const [focused, setFocused] = useState(false);
  const [activo, setActivo] = useState(!soloAlTocar);

  useEffect(() => {
    if (soloAlTocar && activo) campo.current?.focus();
  }, [soloAlTocar, activo]);

  // React Native no tiene box-shadow con spread: el anillo de foco es un borde
  // de 4 px por fuera del campo.
  return (
    <View
      ref={caja}
      style={[
        styles.ring,
        { borderColor: focused && !invalid ? C.ring : "transparent" },
      ]}
    >
      <TextInput
        ref={campo}
        placeholderTextColor={C.ink3}
        multiline={multiline}
        editable={activo}
        onFocus={(e) => {
          setFocused(true);
          avisarFoco(caja.current);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          avisarFoco(null);
          if (soloAlTocar) setActivo(false);
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
      {!activo && (
        <Pressable
          onPress={() => setActivo(true)}
          accessibilityRole="button"
          accessibilityLabel={`Editar: ${rest.accessibilityLabel ?? rest.value ?? ""}`}
          style={StyleSheet.absoluteFill}
        />
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
