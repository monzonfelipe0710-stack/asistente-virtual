import { memo, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { quickReplies as options } from "../../data/mockQuickReplies";
import {
  Palette,
  Radius,
  Shadows,
  Spacing,
  Typography,
  useColors,
} from "../../constants/theme";

interface Props {
  onSelect: (query: string) => void;
  onDismiss: () => void;
}

// memo: los chips son fijos, pero viven dentro del chat que se repinta con cada tecla
function QuickReplies({ onSelect, onDismiss }: Props) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // sin esto el primer toque solo cierra el teclado y hay que tocar dos veces
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            onPress={() => onSelect(opt.query)}
            style={styles.chip}
            activeOpacity={0.7}
          >
            <Ionicons name={opt.icon} size={18} color={C.slate600} />
            <Text style={styles.label}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={onDismiss}
          style={[styles.chip, styles.closeChip]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Ocultar sugerencias"
        >
          <Ionicons name="close" size={20} color={C.slate600} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default memo(QuickReplies);

const createStyles = (C: Palette) =>
  StyleSheet.create({
    // sin fondo propio: los chips flotan sobre el chat, como el botón del menú
    container: {
      backgroundColor: "transparent",
    },
    scroll: {
      paddingHorizontal: Spacing[3],
      // el aire de arriba lo pone el dock; acá solo la separación con el input
      paddingBottom: Spacing[2],
      gap: Spacing[2],
      flexDirection: "row",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[2],
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      backgroundColor: C.slate100,
      borderRadius: Radius.full,
      ...Shadows.sm,
    },
    closeChip: {
      paddingHorizontal: Spacing[3],
      aspectRatio: 1,
      justifyContent: "center",
    },
    label: {
      fontSize: Typography.base,
      color: C.slate700,
      fontWeight: Typography.medium,
    },
  });
