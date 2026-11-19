import { Pressable, StyleSheet } from "react-native";

import { Icon, type IconName } from "@/compartido/ui/Icon";
import { Text } from "@/compartido/ui/Text";
import { Radius, Size, Spacing, Weight, useColors } from "@/compartido/constantes/theme";

export function FilaDelMenu({
  icono,
  texto,
  derecha,
  onPress,
}: {
  icono: IconName;
  texto: string;
  derecha?: React.ReactNode;
  onPress: () => void;
}) {
  const C = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={texto}
      style={({ pressed }) => [styles.fila, pressed && { backgroundColor: C.surface2 }]}
    >
      <Icon name={icono} size={22} color={C.accentText} />
      <Text style={[styles.filaTexto, { color: C.accentText, fontWeight: Weight.semibold }]}>
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
