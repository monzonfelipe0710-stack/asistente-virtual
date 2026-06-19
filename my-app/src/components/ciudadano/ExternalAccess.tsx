import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, Shadows } from "../../constants/theme";

interface QuickLink {
  label: string;
  subtitle: string;
  url: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  iconBg: string;
}

const links: QuickLink[] = [
  {
    label: "MiPortal",
    subtitle: "Accedé a tus trámites y recibos",
    url: "https://miportal.formosa.gob.ar",
    icon: "person-circle-outline",
    bgColor: Colors.primaryLight,
    iconBg: Colors.primary,
  },
  {
    label: "WhatsApp",
    subtitle: "Contactanos al 3704-000000",
    url: "https://wa.me/5493700000000",
    icon: "logo-whatsapp",
    bgColor: Colors.emeraldLight,
    iconBg: Colors.emerald,
  },
];

async function openURL(url: string, label: string) {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Error", `No se puede abrir ${label}.`);
  }
}

export default function ExternalAccess() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Accesos Rápidos</Text>

      <View style={styles.list}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.label}
            style={[styles.row, { backgroundColor: link.bgColor }]}
            onPress={() => openURL(link.url, link.label)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, { backgroundColor: link.iconBg }]}>
              <Ionicons name={link.icon} size={18} color={Colors.white} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.linkLabel}>{link.label}</Text>
              <Text style={styles.linkSubtitle}>{link.subtitle}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={Colors.slate400} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.slate200,
    padding: Spacing[4],
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.slate800,
    marginBottom: Spacing[3],
  },
  list: {
    gap: Spacing[2],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
  },
  linkLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.slate800,
  },
  linkSubtitle: {
    fontSize: Typography.xs,
    color: Colors.slate500,
    marginTop: 1,
  },
});