import { StyleSheet } from "react-native";

import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/compartido/constantes/theme";

export function SectionTitle({ children }: { children: string }) {
  const C = useColors();
  return <Text style={[Type.cardTitle, styles.sectionTitle, { color: C.ink }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: Spacing[8],
    marginBottom: Spacing[1],
  },
});
