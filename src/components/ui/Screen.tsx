import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/constants/theme";

/** El fondo de cada pantalla del panel: una sola superficie con 20 de margen lateral. */
export function Screen({ children }: { children: React.ReactNode }) {
  const C = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.canvas }}
      contentContainerStyle={{
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[1],
        paddingBottom: insets.bottom + Spacing[12],
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

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

/** Título que abre un grupo de contenido, con 32 de aire arriba. */
export function SectionTitle({ children }: { children: string }) {
  const C = useColors();
  return <Text style={[Type.cardTitle, styles.sectionTitle, { color: C.ink }]}>{children}</Text>;
}

/** Título de un bloque (17/600) con su bajada; la acción va a la derecha. */
export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const C = useColors();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionText}>
        <Text style={[Type.cardTitle, { color: C.ink }]}>{title}</Text>
        {!!subtitle && <Text style={[Type.meta, { color: C.ink2 }]}>{subtitle}</Text>}
      </View>
      {right}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: Spacing[3],
    paddingBottom: Spacing[1],
  },
  sectionTitle: {
    marginTop: Spacing[8],
    marginBottom: Spacing[1],
  },
  sectionText: {
    flexShrink: 1,
    gap: 2,
  },
});
