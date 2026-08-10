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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Motion, Radius, Shadows, Spacing, useColors } from "@/constants/theme";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

/**
 * Hoja inferior: velo al 40 %, superficie con radio 28 arriba, asa de 36 × 5 y
 * entrada desde abajo. La usan `Select` y `Modal`.
 */
export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { height: alturaDePantalla } = useWindowDimensions();
  // En Android el teclado se dibuja encima de la hoja: se la sube su alto. En iOS lo hace el Modal.
  const teclado = useKeyboardHeight();
  const alzar = Platform.OS === "android" ? teclado : 0;
  const [entrada] = useState(() => new Animated.Value(0)); // 0 abajo, 1 arriba

  useEffect(() => {
    if (!open) return;
    entrada.setValue(0);
    Animated.timing(entrada, {
      toValue: 1,
      duration: Motion.sheet,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [open, entrada]);

  return (
    <RNModal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim, opacity: entrada }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          Shadows.sheet,
          {
            backgroundColor: C.canvas,
            bottom: alzar,
            maxHeight: alzar > 0 ? alturaDePantalla - alzar - insets.top - Spacing[4] : "93%",
            paddingBottom: alzar > 0 ? Spacing[3] : Math.max(insets.bottom, Spacing[5]) + Spacing[2],
            transform: [
              { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }) },
            ],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: C.borderStrong }]} />
        {children}
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "93%",
    borderTopLeftRadius: Platform.OS === "ios" ? Radius["3xl"] : 32,
    borderTopRightRadius: Platform.OS === "ios" ? Radius["3xl"] : 32,
    paddingTop: Spacing[2],
    paddingHorizontal: Spacing[5],
    gap: Spacing[4],
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
});
