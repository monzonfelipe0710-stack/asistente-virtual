import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Radius, Shadows, Spacing, Typography, useAdminColors } from "../../constants/theme";

/**
 * Diálogo centrado con encabezado y cierre. Es el `Modal` del panel web; acá
 * usa el Modal nativo, que ya se encarga del botón atrás en Android.
 */
export default function Modal({
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
  const C = useAdminColors();

  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        {/* El fondo cierra; la tarjeta no, para que un toque adentro no salga */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.card,
            Shadows.md,
            { backgroundColor: C.paper },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: C.line }]}>
            <Text style={[styles.title, { color: C.ink }]} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={C.muted} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {!!footer && (
            <View style={[styles.footer, { borderTopColor: C.line }]}>{footer}</View>
          )}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: Spacing[4],
  },
  card: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "85%",
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    flexShrink: 1,
  },
  body: {
    padding: Spacing[5],
    gap: Spacing[4],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
