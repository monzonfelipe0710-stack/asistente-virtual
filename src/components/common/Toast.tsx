import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Motion, Spacing, useColors } from "../../constants/theme";

export type ToastType = "success" | "error" | "info" | "warning";

type Push = (message: string, type?: ToastType) => void;

const ToastContext = createContext<Push>(() => {});

export function useToast(): Push {
  return useContext(ToastContext);
}

const LIFETIME_MS = 2200;

/**
 * Aviso v6: una píldora en tinta con el texto en el color del fondo, centrada
 * sobre la barra inferior. Hay uno solo a la vez: el nuevo reemplaza al viejo.
 * El tipo no cambia el color; el mensaje ya dice qué pasó.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback<Push>((next) => {
    setMessage(next);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), LIFETIME_MS);
  }, []);

  // Sin esto, un aviso que sigue en pantalla al desmontar deja el timer vivo.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <ToastPill message={message} visible={visible} />
    </ToastContext.Provider>
  );
}

function ToastPill({ message, visible }: { message: string; visible: boolean }) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: visible ? 1 : 0,
      duration: Motion.duration,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [visible, enter]);

  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { bottom: insets.bottom + 76 }]}
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[
          styles.pill,
          {
            backgroundColor: C.ink,
            opacity: enter,
            transform: [
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            ],
          },
        ]}
      >
        <Text style={[styles.message, { color: C.canvas }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: Spacing[6],
    right: Spacing[6],
    alignItems: "center",
    zIndex: 90,
  },
  pill: {
    paddingHorizontal: Spacing[4],
    paddingVertical: 10,
    borderRadius: 999,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
});
