import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AvisoDeEjemplo } from "@/components/ui/AvisoDeEjemplo";
import { BotonVolver } from "@/components/ui/BotonVolver";
import { Btn } from "@/components/ui/Btn";
import { ScrollConTeclado } from "@/components/ui/Screen";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

export default function RecoverPasswordScreen() {
  const C = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isStaff, requestPasswordReset } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function handleRecovery() {
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el enlace.");
    } finally {
      setSubmitting(false);
    }
  }

  function volver() {
    if (router.canGoBack()) router.back();
    else router.replace("/login");
  }

  if (user) return <Redirect href={isStaff ? "/admin" : "/"} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollConTeclado
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BotonVolver
          etiqueta="Volver a iniciar sesión"
          onPress={volver}
        />

        <Text style={[Type.pageTitle, { color: C.ink, marginTop: Spacing[2] }]}>
          Recuperá tu contraseña
        </Text>
        <Text style={[Type.lead, { color: C.ink2, marginTop: 6 }]}>
          Ingresá tu correo y te enviamos un enlace.
        </Text>
        <View style={{ marginTop: Spacing[4] }}>
          <AvisoDeEjemplo texto="Esta función todavía no está conectada al servidor." />
        </View>

        {enviado ? (
          <View style={[styles.sent, { backgroundColor: C.surface }]}>
            <View style={[styles.sentIcon, { backgroundColor: C.okBg, borderColor: C.ok }]}>
              <Icon name="mail" size={20} color={C.ok} />
            </View>
            <View style={{ flex: 1, gap: Spacing[1] }}>
              <Text style={[Type.bodyStrong, { color: C.ink }]}>Revisá tu correo</Text>
              <Text style={[Type.meta, { color: C.ink2 }]}>
                {`Si ${email} tiene una cuenta, vas a recibir el enlace en unos minutos. Vence en 1 hora.`}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.form}>
              <Field label="Correo electrónico" error={error || undefined}>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="nombre@formosa.gob.ar"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  invalid={!!error}
                />
              </Field>

            </View>

            <Btn
              label="Enviar enlace"
              onPress={handleRecovery}
              loading={submitting}
              style={{ marginTop: Spacing[6] }}
            />
          </>
        )}

        <Btn
          label="Volver a iniciar sesión"
          variant="secondary"
          onPress={volver}
          style={{ marginTop: Spacing[3] }}
        />

        <View style={{ flex: 1, minHeight: Spacing[6] }} />
        <Text
          style={[
            styles.footer,
            { color: C.ink3, paddingBottom: Math.max(insets.bottom, Spacing[5]) + Spacing[3] },
          ]}
        >
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
  sent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[4],
    marginTop: Spacing[6],
    padding: Spacing[4],
    borderRadius: Radius["2xl"],
  },
  sentIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: Spacing[4],
    marginTop: Spacing[6],
  },
  footer: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
});
