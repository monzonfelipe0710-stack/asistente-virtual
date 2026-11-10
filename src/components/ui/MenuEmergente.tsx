import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Modal as RNModal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";
import { Motion, Radius, SombraDeMenu, Spacing, Weight, useColors } from "@/constants/theme";
import { useAjustes } from "@/lib/accesibilidad";

export interface Ancla {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OpcionDeMenu {
  texto: string;
  icono: IconName;
  onPress: () => void;
  /** Acción destructiva, como cerrar sesión: texto e ícono en rojo. */
  peligro?: boolean;
}

const ES_IOS = Platform.OS === "ios";

/**
 * Menú emergente al estilo del menú contextual del iPhone: una tarjeta que
 * crece desde el botón que lo abre, justo encima de él. No oscurece ni
 * difumina el fondo; tocar fuera lo cierra. Radio 18 en iOS y 10 en Android;
 * en iOS el texto va a la izquierda y el ícono a la derecha, y en Android al revés.
 */
export function MenuEmergente({
  ancla,
  opciones,
  onClose,
  compacto = false,
}: {
  ancla: Ancla | null;
  opciones: OpcionDeMenu[];
  onClose: () => void;
  compacto?: boolean;
}) {
  const C = useColors();
  const { height } = useWindowDimensions();
  const { reducirAnimaciones } = useAjustes();
  const [entrada] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!ancla) return;
    entrada.setValue(0);
    Animated.timing(entrada, {
      toValue: 1,
      duration: reducirAnimaciones ? 0 : Motion.duration,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [ancla, entrada, reducirAnimaciones]);

  return (
    <RNModal visible={!!ancla} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar menú"
      />

      {ancla && (() => {
        const altoDeFila = compacto ? 46 : 52;
        const altoTotal = opciones.length * altoDeFila + opciones.length - 1;
        const debajo = compacto && ancla.y + ancla.height + altoTotal + Spacing[4] < height;
        return (
        <Animated.View
          accessibilityRole="menu"
          style={[
            styles.tarjeta,
            SombraDeMenu,
            {
              left: compacto ? ancla.x + Spacing[4] : ancla.x,
              width: compacto ? Math.min(ancla.width - Spacing[6], 236) : ancla.width,
              ...(debajo
                ? { top: ancla.y + ancla.height + Spacing[1] }
                : { bottom: height - ancla.y + Spacing[2] }),
              backgroundColor: C.surface,
              borderColor: C.borderStrong,
              borderRadius: ES_IOS ? Radius.button : 10,
              opacity: entrada,
              transformOrigin: debajo ? "top left" : "bottom left",
              transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        >
          {opciones.map((opcion, indice) => {
            const color = opcion.peligro ? C.danger : C.ink;
            return (
              <View key={opcion.texto}>
                {indice > 0 && <View style={[styles.separador, { backgroundColor: C.border }]} />}
                <Pressable
                  onPress={opcion.onPress}
                  accessibilityRole="menuitem"
                  style={({ pressed }) => [
                    styles.fila,
                    { flexDirection: ES_IOS ? "row" : "row-reverse", minHeight: altoDeFila },
                    pressed && { backgroundColor: C.surface2 },
                  ]}
                >
                  <Text style={[styles.texto, compacto && styles.textoCompacto, { color }]} numberOfLines={1}>
                    {opcion.texto}
                  </Text>
                  <Icon name={opcion.icono} size={22} color={color} />
                </Pressable>
              </View>
            );
          })}
        </Animated.View>
        );
      })()}
    </RNModal>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    position: "absolute",
    borderWidth: 1,
    overflow: "hidden",
  },
  fila: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    minHeight: 52,
  },
  texto: {
    flex: 1,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: Weight.medium,
  },
  textoCompacto: {
    fontSize: 16,
    lineHeight: 20,
  },
  separador: {
    height: 1,
  },
});
