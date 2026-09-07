import { Pressable, StyleSheet } from "react-native";

import { Icon, type IconName } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Size, Spacing, Weight, useColors } from "@/constants/theme";

/** Fila del pie: ícono, texto y algo a la derecha. En azul si es `destacada`. */
export function FilaDelMenu({
  icono,
  texto,
  derecha,
  onPress,
  destacada = false,
  accesibilidad,
}: {
  icono: IconName;
  texto: string;
  derecha?: React.ReactNode;
  onPress: () => void;
  destacada?: boolean;
  accesibilidad?: "switch" | "link" | "button";
}) {
  const C = useColors();
  const color = destacada ? C.accentText : C.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accesibilidad ?? "button"}
      accessibilityLabel={texto}
      style={({ pressed }) => [styles.fila, pressed && { backgroundColor: C.surface2 }]}
    >
      <Icon name={icono} size={22} color={color} />
      <Text style={[styles.filaTexto, { color, fontWeight: destacada ? Weight.semibold : Weight.medium }]}>
        {texto}
      </Text>
      {derecha}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingHorizontal: Spacing[3],
    minHeight: Size.touch,
    borderRadius: Radius.button,
  },
  filaTexto: {
    flex: 1,
    fontSize: 17,
    lineHeight: 21,
  },
});
