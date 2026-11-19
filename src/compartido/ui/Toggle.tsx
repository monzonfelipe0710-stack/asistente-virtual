import { useEffect, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";

import { Motion, useColors } from "@/compartido/constantes/theme";
import { useAjustes } from "@/compartido/lib/accesibilidad";

const ANCHO = Platform.OS === "ios" ? 51 : 52;
const ALTO = Platform.OS === "ios" ? 31 : 32;
const PERILLA = ALTO - 10;
const BORDE = 2;
const MARGEN = 3;
const RECORRIDO = ANCHO - 2 * BORDE - 2 * MARGEN - PERILLA;

export function Toggle({ value }: { value: boolean }) {
  const C = useColors();
  const { reducirAnimaciones } = useAjustes();
  const [x] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(x, {
      toValue: value ? 1 : 0,
      duration: reducirAnimaciones ? 0 : 220,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [value, x, reducirAnimaciones]);

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: value ? C.accent : C.canvas,
          borderColor: value ? C.accent : C.borderStrong,
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.knob,
          {
            backgroundColor: value ? C.onAccent : C.borderStrong,
            transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, RECORRIDO] }) }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: ANCHO,
    height: ALTO,
    borderRadius: 999,
    borderWidth: BORDE,
    justifyContent: "center",
    paddingHorizontal: MARGEN,
  },
  knob: {
    width: PERILLA,
    height: PERILLA,
    borderRadius: 999,
  },
});
