import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BotonVolver } from "@/components/ui/BotonVolver";
import { Btn } from "@/components/ui/Btn";
import { ScrollConTeclado } from "@/components/ui/Screen";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Spacing, Type, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

/** Misma composición que el login: volver arriba, título 28 y bajada. */
export default function ResetPasswordScreen() {
  const C = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { validateResetToken, resetPassword } = useAuth();

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    validateResetToken(token ?? "")
      .then((res) => {
        if (!alive) return;
        setValid(res.ok);
        setChecking(false);
      })
      .catch(() => {
        if (alive) setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, [token, validateResetToken]);

  async function submit() {
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token ?? "", password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = done
    ? "Contraseña cambiada"
    : !valid
      ? "Enlace inválido"
      : "Creá una contraseña nueva";
  const sub = done
    ? "Ya podés entrar con tu nueva contraseña."
    : !valid
      ? "El enlace es inválido o venció. Pedí uno nuevo desde la pantalla de inicio de sesión."
      : "Elegí una que no uses en otro lado.";

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollConTeclado
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, Spacing[5]) + Spacing[5],
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <BotonVolver
          etiqueta="Volver a iniciar sesión"
          onPress={() => router.replace("/login")}
        />

        {checking ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <>
            <Text style={[Type.pageTitle, { color: C.ink, marginTop: Spacing[2] }]}>
              {title}
            </Text>
            <Text style={[Type.lead, { color: C.ink2, marginTop: 6 }]}>{sub}</Text>

            {done || !valid ? (
              <Btn
                label={done ? "Iniciar sesión" : "Volver a iniciar sesión"}
                variant={done ? "primary" : "secondary"}
                onPress={() => router.replace("/login")}
                style={{ marginTop: Spacing[8] }}
              />
            ) : (
              <>
                <View style={styles.form}>
                  <Field label="Nueva contraseña" hint="Al menos 8 caracteres.">
                    <PasswordInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                  </Field>

                  <Field label="Repetí la contraseña" error={error || undefined}>
                    <PasswordInput
                      value={confirm}
                      onChangeText={setConfirm}
                      placeholder="Repetí la contraseña"
                      autoComplete="new-password"
                      invalid={!!error}
                    />
                  </Field>
                </View>

                <Btn
                  label="Guardar contraseña"
                  onPress={submit}
                  loading={submitting}
                  style={{ marginTop: Spacing[6] }}
                />
              </>
            )}
          </>
        )}
      </ScrollConTeclado>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[5],
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: Spacing[4],
    marginTop: Spacing[6],
  },
});
