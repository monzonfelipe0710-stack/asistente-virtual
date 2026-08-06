import { ScrollView, TouchableOpacity, Text, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";

interface Props {
  options: readonly string[];
  active: string;
  onChange: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function FilterPill({ options, active, onChange, containerStyle }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, containerStyle]}
    >
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          onPress={() => onChange(opt)}
          style={[styles.btn, active === opt && styles.btnActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.text, active === opt && styles.textActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexDirection: "row",
    gap: Spacing[2],
  },
  btn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  btnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: Typography.xs,
    color: Colors.slate600,
    fontWeight: Typography.medium,
  },
  textActive: {
    color: Colors.white,
  },
});
