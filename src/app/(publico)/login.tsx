import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BotonVolver } from "@/compartido/ui/BotonVolver";
import { Btn } from "@/compartido/ui/Btn";
import { ScrollConTeclado } from "@/compartido/ui/Screen";
import { Segmented } from "@/compartido/ui/Segmented";
import { Field } from "@/compartido/ui/Field";
import { Input } from "@/compartido/ui/Input";
import { PasswordInput } from "@/compartido/ui/PasswordInput";
import { Text } from "@/compartido/ui/Text";
import { Spacing, Type, useColors } from "@/compartido/constantes/theme";
import { useAuth } from "@/compartido/sesion/AuthContext";
import { mensajeDeError } from "@/compartido/lib/backend";

type Mode = "login" | "register";

const COPY = {
  login: {
    title: "Ingresá a ChatAP",
    sub: "Solo para personal de la Provincia.",
    submit: "Ingresar",
  },
  register: {
    title: "Solicitá tu acceso",
    sub: "Completá tus datos. Administración revisa tu solicitud.",
    submit: "Enviar solicitud",
  },
};

export default function LoginRegisterScreen() {
  const C = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isStaff, login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";
  const copy = COPY[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function iniciarSesion() {
    await login(email, password);
  }

  async function enviarSolicitud() {
    await register({ name, email, password });
  }

  function volver() {
    router.replace("/");
  }

  function cambiarModoDesdeOpcion(opcion: string) {
    if (opcion === "Crear cuenta") {
      switchMode("register");
    } else {
      switchMode("login");
    }
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      if (isLogin) {
        await iniciarSesion();
      } else {
        await enviarSolicitud();
      }
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo completar la acción."));
    } finally {
      setSubmitting(false);
    }
  }

  if (user) {
    if (user.debeCambiarPassword) return <Redirect href="/cambiar-password" />;
    if (isStaff) return <Redirect href="/admin" />;
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollConTeclado
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, Spacing[5]) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BotonVolver
          etiqueta="Volver al asistente"
          onPress={volver}
        />

        <Text style={[Type.pageTitle, { color: C.ink, marginTop: Spacing[2] }]}>
          {copy.title}
        </Text>
        <Text style={[Type.lead, { color: C.ink2, marginTop: 6 }]}>{copy.sub}</Text>

        <View style={{ marginTop: Spacing[5] }}>
          <Segmented
            value={isLogin ? "Ingresar" : "Crear cuenta"}
            options={["Ingresar", "Crear cuenta"]}
            onChange={cambiarModoDesdeOpcion}
          />
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <Field label="Nombre y apellido">
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Ana Pérez"
                autoCapitalize="words"
                autoComplete="name"
              />
            </Field>
          )}

          <Field label="Correo electrónico">
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="nombre@formosa.gob.ar"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </Field>

          <Field label="Contraseña" error={error || undefined}>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              placeholder={isLogin ? "Tu contraseña" : "Mínimo 8 caracteres"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              invalid={!!error}
            />
          </Field>
        </View>

        <Btn
          label={copy.submit}
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: Spacing[6] }}
        />

        {isLogin ? (
          <Btn
            label="¿Olvidaste tu contraseña?"
            variant="ghost"
            size="md"
            onPress={() => router.push("/recuperar")}
            style={{ marginTop: Spacing[2] }}
          />
        ) : (
          <Text style={[Type.meta, { color: C.ink2, marginTop: Spacing[4] }]}>
            Tu cuenta queda pendiente hasta que Administración la apruebe. Mientras tanto no
            podés ingresar.
          </Text>
        )}

        <View style={{ flex: 1, minHeight: Spacing[6] }} />
        <Text style={[styles.footer, { color: C.ink3 }]}>
          Subsecretaría de Recursos Humanos · Formosa
        </Text>
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
    marginTop: Spacing[5],
  },
  footer: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
});
