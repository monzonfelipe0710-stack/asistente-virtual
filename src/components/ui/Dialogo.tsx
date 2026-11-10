import { Children, useEffect, useState, type ReactNode } from "react";
import { Animated, Easing, Modal as RNModal, Pressable, StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Motion, Radius, Shadows, Spacing, Type, useColors } from "@/constants/theme";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useAjustes } from "@/lib/accesibilidad";

export function Dialogo({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const C = useColors();
  const teclado = useKeyboardHeight();
  const { reducirAnimaciones } = useAjustes();
  const [entrada] = useState(() => new Animated.Value(0));
  const acciones = Children.toArray(footer);

  useEffect(() => {
    if (!open) return;
    entrada.setValue(0);
    Animated.timing(entrada, {
      toValue: 1,
      duration: reducirAnimaciones ? 0 : Motion.duration,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [open, entrada, reducirAnimaciones]);

  return (
    <RNModal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim, opacity: entrada }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
      </Animated.View>

      <View style={[styles.centro, { paddingBottom: teclado }]}>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.tarjeta,
            Shadows.sheet,
            {
              backgroundColor: C.canvas,
              opacity: entrada,
              transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
            },
          ]}
        >
          <Text style={[Type.cardTitle, { color: C.ink }]} accessibilityRole="header">
            {title}
          </Text>
          <View style={styles.cuerpo}>{children}</View>
          {acciones.length > 0 && (
            <View style={styles.acciones}>
              {acciones.map((accion, indice) => (
                <View key={indice} style={styles.accion}>
                  {accion}
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  centro: {
    ...StyleSheet.absoluteFill,
    pointerEvents: "box-none",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing[6],
  },
  tarjeta: {
    width: "100%",
    maxWidth: 340,
    gap: Spacing[3],
    padding: Spacing[5],
    borderRadius: Radius["3xl"],
  },
  cuerpo: {
    gap: Spacing[3],
  },
  acciones: {
    flexDirection: "row",
    gap: Spacing[2],
    marginTop: Spacing[1],
  },
  accion: {
    flex: 1,
  },
});
