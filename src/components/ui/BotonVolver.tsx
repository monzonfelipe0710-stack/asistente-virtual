import { Platform, Pressable, StyleSheet, View } from "react-native";

import { Icon } from "./Icon";
import { Size, useColors } from "@/constants/theme";

/** Volver arriba a la izquierda: chevron en iOS y flecha en Android, en un botón redondo de 48. */
export function BotonVolver({ etiqueta, onPress }: { etiqueta: string; onPress: () => void }) {
  const C = useColors();

  return (
    <View style={styles.topBar}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={({ pressed }) => [styles.back, pressed && { backgroundColor: C.surface2 }]}
      >
        <Icon
          name={Platform.OS === "ios" ? "chevronLeft" : "arrowLeft"}
          size={Platform.OS === "ios" ? 26 : 24}
          color={C.ink}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: Size.header,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -12,
  },
  back: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
