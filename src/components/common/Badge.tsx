import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { Radius, Spacing, Typography } from "../../constants/theme";

interface Props {
  label: string;
  bg: string;
  text: string;
  weight?: "medium" | "semibold";
  paddingHorizontal?: number;
  paddingVertical?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Badge({
  label,
  bg,
  text,
  weight = "medium",
  paddingHorizontal = Spacing[2],
  paddingVertical = 3,
  style,
}: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, paddingHorizontal, paddingVertical }, style]}>
      <Text style={[styles.text, { color: text, fontWeight: Typography[weight] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
  },
  text: {
    fontSize: 10,
  },
});
