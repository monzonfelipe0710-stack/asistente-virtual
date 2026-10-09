import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { Radius, Spacing, useColors } from "@/constants/theme";

/** Un punto que se enciende y se apaga; `retraso` lo desfasa del resto. */
function Punto({ retraso }: { retraso: number }) {
  const C = useColors();
  const opacidad = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const pulso = (hasta: number) =>
      Animated.timing(opacidad, {
        toValue: hasta,
        duration: 480,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });

    // Cada vuelta dura 1.2 s: sube, baja y descansa.
    const animacion = Animated.sequence([
      Animated.delay(retraso),
      Animated.loop(Animated.sequence([pulso(1), pulso(0.25), Animated.delay(240)])),
    ]);
    animacion.start();
    return () => animacion.stop();
  }, [opacidad, retraso]);

  return <Animated.View style={[styles.punto, { backgroundColor: C.ink2, opacity: opacidad }]} />;
}

/** Tres puntos de 8 px que se encienden en secuencia mientras el asistente escribe. */
export function TypingIndicator() {
  return (
    <View
      style={styles.fila}
      accessibilityLabel="El asistente está escribiendo"
      accessibilityLiveRegion="polite"
    >
      <Punto retraso={0} />
      <Punto retraso={200} />
      <Punto retraso={400} />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[5],
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
});
