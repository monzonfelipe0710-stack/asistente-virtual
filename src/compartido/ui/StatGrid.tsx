import { StyleSheet, View } from "react-native";

import { Spacing } from "@/compartido/constantes/theme";

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[3],
  },
});
