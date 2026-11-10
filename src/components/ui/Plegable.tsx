import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { Motion } from "@/constants/theme";
import { useAjustes } from "@/lib/accesibilidad";

/**
 * Muestra u oculta su contenido encogiéndolo hasta altura cero mientras se
 * desvanece, con la misma curva que el resto de la app. Sin esto, quitar una
 * fila de golpe hace saltar todo lo que está alrededor.
 */
export function Plegable({
  abierto,
  children,
}: {
  abierto: boolean;
  children: React.ReactNode;
}) {
  const { reducirAnimaciones } = useAjustes();
  const [progreso] = useState(() => new Animated.Value(abierto ? 1 : 0));
  const [alto, setAlto] = useState<number | null>(null);

  useEffect(() => {
    Animated.timing(progreso, {
      toValue: abierto ? 1 : 0,
      duration: reducirAnimaciones ? 0 : Motion.sheet,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: false, // la altura es de layout
    }).start();
  }, [abierto, progreso, reducirAnimaciones]);

  return (
    <Animated.View
      pointerEvents={abierto ? "auto" : "none"}
      style={[
        styles.recorte,
        {
          opacity: progreso,
          // Hasta medir el contenido, la altura es la natural.
          height: alto === null ? undefined : progreso.interpolate({ inputRange: [0, 1], outputRange: [0, alto] }),
        },
      ]}
    >
      <View onLayout={(e) => setAlto(e.nativeEvent.layout.height)}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  recorte: {
    overflow: "hidden",
  },
});
