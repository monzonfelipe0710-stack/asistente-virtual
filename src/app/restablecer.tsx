import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../components/common/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatBotAvatar from "../components/ChatBotAvatar";
import { Btn, Field, Input } from "../components/admin/ui";
import Icon from "../components/common/Icon";
import { Radius, Size, Spacing, Type, useAdminColors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

/** Misma composición que el login: volver arriba, avatar, título 28 y bajada. */
export default function ResetPasswordScreen() {
  const C = useAdminColors();
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
    validateResetToken(token ?? "").then((res) => {
      if (!alive) return;
      setValid(res.ok);
      setChecking(false);
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
      : "Nueva contraseña";
  const sub = done
    ? "Ya podés entrar con tu nueva contraseña."
    : !valid
      ? "El enlace es inválido o venció. Pedí uno nuevo desde la pantalla de inicio de sesión."
      : "Elegí una contraseña de al menos 6 caracteres.";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: C.canvas }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, Spacing[5]) + Spacing[5],
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.replace("/login")}
            accessibilityRole="button"
            accessibilityLabel="Volver a iniciar sesión"
            style={({ pressed }) => [styles.back, pressed && { backgroundColor: C.mist }]}
          >
            <Icon name="chevronLeft" size={22} color={C.ink} />
          </Pressable>
        </View>

        {checking ? (
          <View style={styles.loading}>
            <ActivityIndicator color={C.brand} />
          </View>
        ) : (
          <>
            <View style={{ marginTop: Spacing[4], alignSelf: "flex-start" }}>
              <ChatBotAvatar size={48} tight static />
            </View>
            <Text style={[Type.pageTitle, { color: C.ink, marginTop: Spacing[6] }]}>
              {title}
            </Text>
            <Text style={[Type.lead, { color: C.muted, marginTop: Spacing[2] }]}>{sub}</Text>

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
                  <Field label="Nueva contraseña">
                    <Input
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Mínimo 6 caracteres"
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </Field>

                  <Field label="Repetir contraseña" error={error}>
                    <Input
                      value={confirm}
                      onChangeText={setConfirm}
                      placeholder="Repetí la contraseña"
                      secureTextEntry
                      autoCapitalize="none"
                      invalid={!!error}
                    />
                  </Field>
                </View>

                <Btn
                  label="Guardar"
                  onPress={submit}
                  loading={submitting}
                  style={{ marginTop: Spacing[6] }}
                />
              </>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[5],
  },
  topBar: {
    height: Size.header,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -11,
  },
  back: {
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
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
