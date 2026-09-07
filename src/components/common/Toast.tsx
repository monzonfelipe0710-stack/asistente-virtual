import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Radius, Shadows, Spacing, Typography, useAdminColors } from "../../constants/theme";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Push = (message: string, type?: ToastType) => void;

const ToastContext = createContext<Push>(() => {});

export function useToast(): Push {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "close-circle",
  info: "information-circle",
  warning: "warning",
};

const LIFETIME_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback<Push>(
    (message, type = "success") => {
      // Date.now() puede repetirse si entran dos avisos en el mismo ms.
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current.push(setTimeout(() => remove(id), LIFETIME_MS));
    },
    [remove]
  );

  // Sin esto, un aviso que sigue en cola al desmontar deja el timer vivo.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <ToastStack toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.stack, { bottom: insets.bottom + Spacing[4] }]}
    >
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </View>
  );
}

function ToastRow({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const C = useAdminColors();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const bg =
    toast.type === "error"
      ? C.bad
      : toast.type === "warning"
        ? C.warn
        : toast.type === "info"
          ? C.info
          : C.ok;

  return (
    <Animated.View
      style={[
        styles.toast,
        Shadows.md,
        {
          backgroundColor: bg,
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}
    >
      <Ionicons name={ICONS[toast.type]} size={18} color="#ffffff" />
      <Text style={styles.message}>{toast.message}</Text>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
        hitSlop={8}
      >
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.75)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: "absolute",
    left: Spacing[4],
    right: Spacing[4],
    gap: Spacing[2],
    zIndex: 50,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  message: {
    flex: 1,
    color: "#ffffff",
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
});
