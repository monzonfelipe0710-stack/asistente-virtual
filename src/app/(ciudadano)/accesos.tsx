import { Linking, Pressable, StyleSheet, View } from "react-native";

import { Encabezado } from "@/components/menu/Encabezado";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";

interface Acceso {
  nombre: string;
  descripcion: string;
  icono: IconName;
  /** Sin dirección, el toque muestra la descripción como aviso. */
  url?: string;
}

const ACCESOS: Acceso[] = [
  {
    nombre: "MiPortal",
    descripcion: "Datos y recibos",
    icono: "user",
    url: "https://miportal.formosa.gob.ar",
  },
  {
    nombre: "Recibo de haberes",
    descripcion: "Último período",
    icono: "cash",
    url: "https://miportal.formosa.gob.ar",
  },
  {
    nombre: "WhatsApp",
    descripcion: "3704-000000",
    icono: "phone",
    url: "https://wa.me/5493700000000",
  },
  {
    nombre: "Mesa de Entradas",
    descripcion: "Lun a vie, 07 a 13 h",
    icono: "pin",
  },
];

/** Ruta "/accesos": sistemas provinciales, en una grilla de dos columnas. */
export default function Accesos() {
  const C = useColors();
  const toast = useToast();

  async function abrir(acceso: Acceso) {
    if (!acceso.url) return toast(`${acceso.nombre}: ${acceso.descripcion}`);

    toast(`Abriendo ${acceso.nombre}…`);
    if (await Linking.canOpenURL(acceso.url)) await Linking.openURL(acceso.url);
    else toast(`No se puede abrir ${acceso.nombre}.`);
  }

  return (
    <View style={[styles.pantalla, { backgroundColor: C.canvas }]}>
      <Encabezado titulo="Accesos" />

      <Screen>
        <Text style={[Type.lead, { color: C.ink2, marginBottom: Spacing[2] }]}>
          Sistemas provinciales, a un toque.
        </Text>

        <View style={styles.grilla}>
          {ACCESOS.map((acceso) => (
            <Pressable
              key={acceso.nombre}
              onPress={() => abrir(acceso)}
              accessibilityRole="link"
              accessibilityLabel={`${acceso.nombre}. ${acceso.descripcion}`}
              style={({ pressed }) => [
                styles.tarjeta,
                { backgroundColor: pressed ? C.surface2 : C.surface },
              ]}
            >
              <Icon name={acceso.icono} size={22} color={C.ink2} />
              <View>
                <Text style={[styles.nombre, { color: C.ink }]}>{acceso.nombre}</Text>
                <Text style={[styles.descripcion, { color: C.ink2 }]}>{acceso.descripcion}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  grilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  tarjeta: {
    // dos columnas exactas: (100 % − 12) / 2
    width: "48%",
    flexGrow: 1,
    minHeight: 140,
    justifyContent: "space-between",
    gap: Spacing[6],
    padding: Spacing[4],
    borderRadius: Radius.xl,
  },
  nombre: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: Weight.semibold,
  },
  descripcion: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
