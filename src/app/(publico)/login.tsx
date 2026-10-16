import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBotAvatar } from "@/components/avatar/ChatBotAvatar";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Btn } from "@/components/ui/Btn";
import { ScrollConTeclado } from "@/components/ui/Screen";
import { Segmented } from "@/components/ui/Segmented";
import { Field } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, Weight, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

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

const PASOS: { texto: string; icono: IconName; estado: "hecho" | "actual" | "futuro" }[] = [
  { texto: "Solicitud enviada", icono: "check", estado: "hecho" },
  { texto: "En revisión por Administración", icono: "clock", estado: "actual" },
  { texto: "Cuenta aprobada", icono: "more", estado: "futuro" },
];

/** Pantalla que sigue al envío de la solicitud: dice que quedó pendiente y en qué paso está. */
function SolicitudEnviada({ onTerminar }: { onTerminar: () => void }) {
  const C = useColors();
  return (
    <>
      <View style={styles.centro}>
        <ChatBotAvatar size={72} />
        <Text style={[Type.pageTitle, { color: C.ink, textAlign: "center" }]}>Solicitud enviada</Text>
        <Text style={[Type.lead, { color: C.ink2, textAlign: "center" }]}>
          Tu cuenta está pendiente. Cuando Administración la apruebe, vas a poder ingresar con tu
          correo y tu contraseña.
        </Text>
      </View>

      <View style={[styles.pasos, { backgroundColor: C.surface, borderColor: C.border }]}>
        {PASOS.map((paso) => {
          const hecho = paso.estado === "hecho";
          return (
            <View key={paso.texto} style={styles.paso}>
              <View
                style={[
                  styles.pasoIcono,
                  {
                    backgroundColor: hecho ? C.accent : C.canvas,
                    borderColor: paso.estado === "futuro" ? C.borderStrong : C.accent,
                  },
                ]}
              >
                <Icon name={paso.icono} size={18} color={hecho ? C.onAccent : C.ink} />
              </View>
              <Text
                style={[
                  styles.pasoTexto,
                  {
                    color: C.ink,
                    fontWeight: paso.estado === "actual" ? Weight.bold : Weight.medium,
                  },
                ]}
              >
                {paso.texto}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1, minHeight: Spacing[6] }} />
      <Btn label="Volver al inicio" onPress={onTerminar} />
    </>
  );
}

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
  const [enviada, setEnviada] = useState(false);

  const isLogin = mode === "login";
  const copy = COPY[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ name, email, password });
        setPassword("");
        setEnviada(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setSubmitting(false);
    }
  }

  // Con una sesión abierta no hay nada que hacer acá: staff al panel, el resto al asistente.
  if (user) return <Redirect href={isStaff ? "/admin" : "/"} />;

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
          etiqueta={enviada ? "Volver" : "Volver al asistente"}
          onPress={() => (enviada ? setEnviada(false) : router.replace("/"))}
        />

        {enviada ? (
          <SolicitudEnviada onTerminar={() => router.replace("/")} />
        ) : (
          <>
            <Text style={[Type.pageTitle, { color: C.ink, marginTop: Spacing[2] }]}>
              {copy.title}
            </Text>
            <Text style={[Type.lead, { color: C.ink2, marginTop: 6 }]}>{copy.sub}</Text>

            <View style={{ marginTop: Spacing[5] }}>
              <Segmented
                value={isLogin ? "Ingresar" : "Crear cuenta"}
                options={["Ingresar", "Crear cuenta"]}
                onChange={(v) => switchMode(v === "Crear cuenta" ? "register" : "login")}
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
  form: {
    gap: Spacing[4],
    marginTop: Spacing[5],
  },
  centro: {
    alignItems: "center",
    gap: Spacing[3],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[5],
  },
  pasos: {
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  paso: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  pasoIcono: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pasoTexto: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
  },
  footer: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
});
