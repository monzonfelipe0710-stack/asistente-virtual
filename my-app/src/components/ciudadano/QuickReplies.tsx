import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";

interface QuickReply {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  query: string;
}

const options: QuickReply[] = [
  {
    label: "Preguntas Frecuentes",
    icon: "chatbubble-ellipses-outline",
    query: "¿Cuáles son las preguntas frecuentes?",
  },
  {
    label: "Guía de Trámites",
    icon: "document-text-outline",
    query: "¿Cuál es la guía de trámites disponibles?",
  },
  {
    label: "Descargar Formularios",
    icon: "download-outline",
    query: "Necesito descargar formularios",
  },
];

interface Props {
  onSelect: (query: string) => void;
}

export default function QuickReplies({ onSelect }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            onPress={() => onSelect(opt.query)}
            style={styles.chip}
            activeOpacity={0.7}
          >
            <Ionicons name={opt.icon} size={14} color={Colors.slate600} />
            <Text style={styles.label}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    backgroundColor: Colors.slate50,
  },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: Radius.lg,
  },
  label: {
    fontSize: Typography.xs,
    color: Colors.slate700,
    fontWeight: Typography.medium,
  },
});
