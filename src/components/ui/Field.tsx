import { StyleSheet, View } from "react-native";

import { Icon } from "./Icon";
import { Text } from "./Text";
import { Type, Weight, useColors } from "@/constants/theme";

/** Etiqueta 15/600 arriba, el campo en medio, la pista o el error con ícono abajo. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const C = useColors();
  return (
    <View style={styles.fieldBox}>
      <Text style={[styles.label, { color: C.ink }]}>{label}</Text>
      {children}
      {!!hint && !error && <Text style={[Type.meta, { color: C.ink2 }]}>{hint}</Text>}
      {!!error && (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Icon name="alert" size={18} color={C.danger} />
          <Text style={[Type.meta, styles.errorText, { color: C.danger }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBox: {
    gap: 6,
  },
  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: Weight.semibold,
  },
  error: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  errorText: {
    flex: 1,
    fontWeight: Weight.semibold,
  },
});
