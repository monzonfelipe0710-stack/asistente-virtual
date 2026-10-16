import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Input } from "./Input";
import { Icon } from "./Icon";
import { Text } from "./Text";
import { Weight, useColors } from "@/constants/theme";

/** Campo de contraseña: "Mostrar" u "Ocultar" con ojo, dentro del campo de 56. */
export function PasswordInput({
  value,
  onChangeText,
  placeholder,
  autoComplete,
  invalid = false,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
}) {
  const C = useColors();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoComplete={autoComplete}
        invalid={invalid}
        style={{ paddingRight: 116 }}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={styles.ojo}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={20} color={C.accentText} />
        <Text style={[styles.texto, { color: C.accentText }]}>
          {visible ? "Ocultar" : "Mostrar"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ojo: {
    position: "absolute",
    right: 8,
    top: 6,
    height: 44,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  texto: {
    fontSize: 15,
    fontWeight: Weight.semibold,
  },
});
