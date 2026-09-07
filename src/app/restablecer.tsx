import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Card, Field, Input } from "../components/admin/ui";
import { Spacing, Typography, useAdminColors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: C.canvas }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: Spacing[4],
          paddingTop: insets.top + Spacing[8],
          paddingBottom: insets.bottom + Spacing[10],
          flexGrow: 1,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Card
          padded
          style={{ gap: Spacing[4], maxWidth: 440, width: "100%", alignSelf: "center" }}
        >
          {checking ? (
            <View style={{ alignItems: "center", paddingVertical: Spacing[6] }}>
              <ActivityIndicator color={C.brand} />
            </View>
          ) : done ? (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={38}
                color={C.ok}
                style={styles.icon}
              />
              <Text style={[styles.title, { color: C.ink }]}>Contraseña cambiada</Text>
              <Text style={[styles.help, { color: C.muted }]}>
                Ya podés entrar con tu nueva contraseña.
              </Text>
              <Btn label="Iniciar sesión" onPress={() => router.replace("/login")} />
            </>
          ) : !valid ? (
            <>
              <Ionicons
                name="alert-circle-outline"
                size={38}
                color={C.bad}
                style={styles.icon}
              />
              <Text style={[styles.title, { color: C.ink }]}>Enlace inválido</Text>
              <Text style={[styles.help, { color: C.muted }]}>
                El enlace es inválido o venció. Pedí uno nuevo desde la pantalla de
                inicio de sesión.
              </Text>
              <Btn
                label="Volver a iniciar sesión"
                variant="ghost"
                onPress={() => router.replace("/login")}
              />
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: C.ink }]}>Nueva contraseña</Text>
              <Text style={[styles.help, { color: C.muted }]}>
                Elegí una contraseña de al menos 6 caracteres.
              </Text>

              <Field label="Nueva contraseña" required>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </Field>

              <Field label="Repetir contraseña" required error={error}>
                <Input
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repetí la contraseña"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </Field>

              <Btn label="Guardar" onPress={submit} loading={submitting} />

              <Pressable onPress={() => router.replace("/login")} accessibilityRole="link">
                <Text style={[styles.link, { color: C.muted }]}>Cancelar</Text>
              </Pressable>
            </>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignSelf: "center",
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    textAlign: "center",
  },
  help: {
    fontSize: Typography.base,
    lineHeight: 20,
    textAlign: "center",
  },
  link: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    textAlign: "center",
  },
});
