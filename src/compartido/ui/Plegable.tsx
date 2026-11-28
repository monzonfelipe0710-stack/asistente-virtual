import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Motion } from "@/compartido/constantes/theme";
import { useAjustes } from "@/compartido/lib/accesibilidad";

// Anima el alto, que no se puede pasar al hilo nativo con Animated: con Reanimated cada cuadro se
// calcula en el hilo de la interfaz y no compite con el JavaScript del chat.
export function Plegable({
  abierto,
  children,
}: {
  abierto: boolean;
  children: React.ReactNode;
}) {
  const { reducirAnimaciones } = useAjustes();
  const progreso = useSharedValue(abierto ? 1 : 0);
  const [alto, setAlto] = useState<number | null>(null);

  useEffect(() => {
    progreso.set(
      withTiming(abierto ? 1 : 0, {
        duration: reducirAnimaciones ? 0 : Motion.sheet,
        easing: Easing.bezier(...Motion.bezier),
      })
    );
  }, [abierto, progreso, reducirAnimaciones]);

  const estilo = useAnimatedStyle(() =>
    alto === null
      ? { opacity: progreso.get() }
      : { opacity: progreso.get(), height: progreso.get() * alto }
  );

  return (
    <Animated.View pointerEvents={abierto ? "auto" : "none"} style={[styles.recorte, estilo]}>
      <View onLayout={(e) => setAlto(e.nativeEvent.layout.height)}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  recorte: {
    overflow: "hidden",
  },
});
