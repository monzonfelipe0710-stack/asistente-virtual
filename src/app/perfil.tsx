import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DialogoCerrarSesion } from "@/components/menu/DialogoCerrarSesion";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type Tone } from "@/components/ui/Badge";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Btn } from "@/components/ui/Btn";
import { Desvanecido } from "@/components/ui/Desvanecido";
import { KeyValue, KeyValueCard } from "@/components/ui/KeyValue";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Spacing, Type, Weight, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/date";

const TONO_DEL_ESTADO: Record<string, Tone> = {
  Activo: "ok",
  Pendiente: "warn",
  Rechazado: "bad",
  Suspendido: "bad",
};

/** Ruta "/perfil": los datos de la cuenta con la sesión abierta. */
export default function Perfil() {
  const C = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, logout } = useAuth();
  const [confirmando, setConfirmando] = useState(false);

  if (loading) return null;
  if (!user) return <Redirect href="/login" />;

  async function cerrarSesion() {
    router.replace("/");
    await logout();
  }

  const estado = user.status ?? "Activo";

  return (
    <View style={[styles.pantalla, { backgroundColor: C.canvas, paddingTop: insets.top }]}>
      <View style={styles.volver}>
        <BotonVolver etiqueta="Volver" onPress={() => router.back()} />
      </View>

      <View style={styles.contenido}>
        <Screen>
          <View style={styles.cuenta}>
            <Avatar name={user.name || user.email} size={80} />
            <Text style={[styles.nombre, { color: C.ink }]}>{user.name}</Text>
            <Text style={[Type.lead, { color: C.ink2, textAlign: "center" }]}>{user.email}</Text>
          </View>

          <KeyValueCard>
            <KeyValue label="Rol" value={user.role} />
            <KeyValue label="Estado">
              <Badge label={estado} tone={TONO_DEL_ESTADO[estado] ?? "muted"} />
            </KeyValue>
            <KeyValue label="Alta" value={formatDate(user.createdAt) || "Sin dato"} />
          </KeyValueCard>

          <Text style={[Type.meta, { color: C.ink2, marginTop: Spacing[4] }]}>
            Son los datos reales de tu cuenta. Para cambiarlos, hablá con Administración.
          </Text>

          <Btn
            label="Cerrar sesión"
            variant="danger"
            icon="logout"
            onPress={() => setConfirmando(true)}
            style={{ marginTop: Spacing[8] }}
          />
        </Screen>
        <Desvanecido alto={Spacing[4]} />
      </View>

      <DialogoCerrarSesion
        open={confirmando}
        onClose={() => setConfirmando(false)}
        onConfirmar={cerrarSesion}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
  },
  volver: {
    paddingHorizontal: Spacing[5],
  },
  contenido: {
    flex: 1,
  },
  cuenta: {
    marginTop: Spacing[4],
    alignItems: "center",
    gap: Spacing[2],
    marginBottom: Spacing[6],
  },
  nombre: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: Weight.bold,
    textAlign: "center",
  },
});
