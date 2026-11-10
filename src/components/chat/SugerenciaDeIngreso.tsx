import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { readJSON, writeJSON } from "@/lib/storage";

const CLAVE = "chatap.sugerenciaDeIngreso";

/**
 * Tarjeta que invita a iniciar sesión a quien no tiene sesión abierta. Se puede
 * descartar con la X y el descarte se recuerda en el dispositivo.
 */
export function SugerenciaDeIngreso() {
  const C = useColors();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [descartada, setDescartada] = useState<boolean | null>(null);

  useEffect(() => {
    readJSON<boolean>(CLAVE, false).then(setDescartada);
  }, []);

  if (loading || user || descartada !== false) return null;

  function descartar() {
    setDescartada(true);
    writeJSON(CLAVE, true);
  }

  return (
    <View style={styles.contenedor}>
      <View style={[styles.tarjeta, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.cabecera}>
          <View style={[styles.icono, { backgroundColor: C.activeBg, borderColor: C.accent }]}>
            <Icon name="user" size={22} color={C.accentText} />
          </View>
          <View style={styles.texto}>
            <Text style={[Type.rowTitle, { color: C.ink }]}>¿Sos personal de la Provincia?</Text>
            <Text style={[Type.meta, { color: C.ink2 }]}>
              Ingresá con tu cuenta para usar el panel interno.
            </Text>
          </View>
          <Pressable
            onPress={descartar}
            accessibilityRole="button"
            accessibilityLabel="Descartar sugerencia"
            hitSlop={8}
            style={({ pressed }) => [styles.cerrar, pressed && { backgroundColor: C.surface2 }]}
          >
            <Icon name="close" size={20} color={C.ink2} />
          </Pressable>
        </View>
        <Btn label="Ingresar" size="md" variant="secondary" onPress={() => router.push("/login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
  },
  tarjeta: {
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  texto: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cerrar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
