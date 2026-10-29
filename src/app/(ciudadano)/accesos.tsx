import { Linking, Pressable, StyleSheet, View } from "react-native";

import { Encabezado } from "@/components/menu/Encabezado";
import { AvisoDeEjemplo } from "@/components/ui/AvisoDeEjemplo";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useToast } from "@/components/ui/Toast";
import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import { accesos, type Acceso } from "@/data/mockAccesos";

/** Ruta "/accesos": sistemas y contactos de Recursos Humanos, en una lista. */
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
        <Text style={[Type.lead, { color: C.ink2, marginBottom: Spacing[4] }]}>
          Sistemas y contactos de Recursos Humanos.
        </Text>

        <View>
          {accesos.map((acceso, indice) => (
            <Pressable
              key={acceso.nombre}
              onPress={() => abrir(acceso)}
              accessibilityRole="link"
              accessibilityLabel={`${acceso.nombre}. ${acceso.descripcion}`}
              style={({ pressed }) => [
                styles.fila,
                {
                  borderBottomColor: C.border,
                  borderBottomWidth: indice === accesos.length - 1 ? 0 : 1,
                },
                pressed && { backgroundColor: C.surface },
              ]}
            >
              <View style={[styles.icono, { backgroundColor: C.surface2 }]}>
                <Icon name={acceso.icono} size={22} color={C.ink} />
              </View>
              <View style={styles.texto}>
                <Text style={[Type.rowTitle, { color: C.ink }]}>{acceso.nombre}</Text>
                <Text style={[Type.meta, { color: C.ink2 }]}>{acceso.descripcion}</Text>
                {!!acceso.url && (
                  <Text style={[Type.mono, styles.url, { color: C.ink2 }]} numberOfLines={1}>
                    {acceso.url.replace(/^https?:\/\//, "")}
                  </Text>
                )}
              </View>
              {!!acceso.url && <Icon name="chevronRight" size={20} color={C.ink2} />}
            </Pressable>
          ))}
        </View>

        <View style={styles.aviso}>
          <AvisoDeEjemplo texto="El teléfono y el horario son de ejemplo hasta que la Subsecretaría los confirme." />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 72,
    paddingVertical: Spacing[3] + 2,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  url: {
    marginTop: 4,
  },
  aviso: {
    marginTop: Spacing[4],
  },
});
