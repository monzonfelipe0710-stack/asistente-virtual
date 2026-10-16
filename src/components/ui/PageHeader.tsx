import { StyleSheet, View } from "react-native";

import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/constants/theme";

/** Título de pantalla 28/34 y bajada 15/22. Las acciones van debajo. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const C = useColors();
  return (
    <View style={styles.pageHeader}>
      <Text style={[Type.pageTitle, { color: C.ink }]}>{title}</Text>
      {!!description && <Text style={[Type.lead, { color: C.ink2 }]}>{description}</Text>}
      {!!children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    marginBottom: Spacing[6],
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
});
