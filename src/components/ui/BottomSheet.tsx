import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Motion, Radius, Shadows, Spacing, useColors } from "@/constants/theme";

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
  const entrada = useRef(new Animated.Value(0)).current; // 0 abajo, 1 arriba

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
            paddingBottom: Math.max(insets.bottom, Spacing[5]) + Spacing[2],
            transform: [
              { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [700, 0] }) },
            ],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: C.surface2 }]} />
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
    maxHeight: "88%",
    borderTopLeftRadius: Radius["3xl"],
    borderTopRightRadius: Radius["3xl"],
    paddingTop: Spacing[2],
    paddingHorizontal: Spacing[5],
    gap: Spacing[4],
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
});
