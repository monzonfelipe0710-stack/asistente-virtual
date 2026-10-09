import { Children, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "./Text";

import { BottomSheet } from "./BottomSheet";
import { Spacing, Type, useColors } from "@/constants/theme";

/**
 * Edición en hoja inferior: título 20/26, contenido con 16 entre campos y las
 * acciones abajo a lo ancho, repartidas en partes iguales. `footer` es un
 * botón o un arreglo de botones. Se cierra tocando el velo o con el botón
 * atrás de Android.
 */
export function Modal({
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
  const actions = Children.toArray(footer);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flexShrink}
      >
        <Text style={[Type.sheetTitle, { color: C.ink }]} accessibilityRole="header">
          {title}
        </Text>

        <ScrollView
          style={styles.flexShrink}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {actions.length > 0 && (
          <View style={styles.footer}>
            {actions.map((a, i) => (
              <View key={i} style={styles.action}>
                {a}
              </View>
            ))}
          </View>
        )}
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flexShrink: {
    flexShrink: 1,
  },
  body: {
    paddingTop: Spacing[4],
    gap: Spacing[4],
  },
  footer: {
    flexDirection: "row",
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  action: {
    flex: 1,
  },
});
