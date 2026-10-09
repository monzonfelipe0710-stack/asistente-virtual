import { useMemo } from "react";
import { View, Pressable, StyleSheet, Linking } from "react-native";
import { Text } from "../common/Text";
import Icon, { type IconName } from "../common/Icon";
import { useToast } from "../common/Toast";
import { Palette, Radius, Spacing, Type, useColors } from "../../constants/theme";

interface QuickLink {
  label: string;
  subtitle: string;
  /** Sin URL, el toque muestra `subtitle` como aviso. */
  url?: string;
  icon: IconName;
}

const links: QuickLink[] = [
  {
    label: "MiPortal",
    subtitle: "Datos y recibos",
    url: "https://miportal.formosa.gob.ar",
    icon: "user",
  },
  {
    label: "Recibo de haberes",
    subtitle: "Último período",
    url: "https://miportal.formosa.gob.ar",
    icon: "cash",
  },
  {
    label: "WhatsApp",
    subtitle: "3704-000000",
    url: "https://wa.me/5493700000000",
    icon: "phone",
  },
  {
    label: "Mesa de Entradas",
    subtitle: "Lun a vie, 07 a 13 h",
    icon: "pin",
  },
];

/**
 * Accesos: grilla de dos columnas (separación 12), tarjetas grises de radio 16
 * y 140 de alto mínimo, ícono arriba y nombre con descripción abajo.
 */
export default function ExternalAccess() {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const toast = useToast();

  async function open(link: QuickLink) {
    if (!link.url) return toast(`${link.label}: ${link.subtitle}`);
    toast(`Abriendo ${link.label}…`);
    const supported = await Linking.canOpenURL(link.url);
    if (supported) await Linking.openURL(link.url);
    else toast(`No se puede abrir ${link.label}.`, "error");
  }

  return (
    <View>
      <Text style={styles.subtitle}>Sistemas provinciales, a un toque.</Text>

      <View style={styles.grid}>
        {links.map((link) => (
          <Pressable
            key={link.label}
            onPress={() => open(link)}
            accessibilityRole="link"
            accessibilityLabel={`${link.label}. ${link.subtitle}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: pressed ? C.surface2 : C.surface },
            ]}
          >
            <Icon name={link.icon} size={22} color={C.ink2} />
            <View>
              <Text style={styles.label}>{link.label}</Text>
              <Text style={styles.desc}>{link.subtitle}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (C: Palette) =>
  StyleSheet.create({
    subtitle: {
      ...Type.lead,
      color: C.ink2,
      marginBottom: Spacing[2],
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing[3],
      marginTop: Spacing[2],
    },
    card: {
      // dos columnas exactas: (100 % − 12) / 2
      width: "48%",
      flexGrow: 1,
      minHeight: 140,
      justifyContent: "space-between",
      gap: Spacing[6],
      padding: Spacing[4],
      borderRadius: Radius.xl,
    },
    label: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "600",
      color: C.ink,
    },
    desc: {
      fontSize: 13,
      lineHeight: 18,
      color: C.ink2,
      marginTop: 2,
    },
  });
