import { Redirect } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn } from "@/components/ui/Btn";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ScrollConTeclado } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { Spacing, Type, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

export default function CambiarPasswordScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { user, isStaff, changePassword, logout } = useAuth();

  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function guardar() {
    setError("");
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(actual, nueva);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return <Redirect href="/login" />;
  if (!user.debeCambiarPassword) return <Redirect href={isStaff ? "/admin" : "/"} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollConTeclado
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + Spacing[5],
            paddingBottom: Math.max(insets.bottom, Spacing[5]) + Spacing[5],
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[Type.pageTitle, { color: C.ink }]}>Cambiá tu contraseña</Text>
        <Text style={[Type.lead, { color: C.ink2, marginTop: 6 }]}>
          Es tu primer ingreso. Tenés que elegir una contraseña nueva antes de continuar.
        </Text>

        <View style={styles.form}>
          <Field label="Contraseña actual">
            <PasswordInput
              value={actual}
              onChangeText={setActual}
              placeholder="La que te pasaron"
              autoComplete="current-password"
            />
          </Field>

          <Field label="Nueva contraseña" hint="Al menos 8 caracteres.">
            <PasswordInput
              value={nueva}
              onChangeText={setNueva}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </Field>

          <Field label="Repetí la contraseña" error={error || undefined}>
            <PasswordInput
              value={confirmar}
              onChangeText={setConfirmar}
              placeholder="Repetí la contraseña"
              autoComplete="new-password"
              invalid={!!error}
            />
          </Field>
        </View>

        <Btn
          label="Guardar contraseña"
          onPress={guardar}
          loading={submitting}
          style={{ marginTop: Spacing[6] }}
        />
        <Btn
          label="Cerrar sesión"
          variant="ghost"
          size="md"
          onPress={logout}
          style={{ marginTop: Spacing[2] }}
        />
      </ScrollConTeclado>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[5],
  },
  form: {
    gap: Spacing[4],
    marginTop: Spacing[6],
  },
});
