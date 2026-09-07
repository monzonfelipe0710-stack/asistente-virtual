import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatBotAvatar from "../components/ChatBotAvatar";
import { Btn, Card, Field, Input, Select } from "../components/admin/ui";
import {
  Spacing,
  Type,
  Typography,
  useAdminColors,
} from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { employeeDepartments } from "../data/mockEmployeeApprovals";

type Mode = "login" | "register";

/** Campo de contraseña con el ojo para mostrarla. */
function PasswordInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const C = useAdminColors();
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ justifyContent: "center" }}>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoComplete="password"
        style={{ paddingRight: 34 }}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        hitSlop={8}
        style={styles.eye}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={18}
          color={C.faint}
        />
      </Pressable>
    </View>
  );
}

export default function LoginRegisterScreen() {
  const C = useAdminColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, register, requestPasswordReset } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wantsEmployee, setWantsEmployee] = useState(false);
  const [cuil, setCuil] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [recovery, setRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryLink, setRecoveryLink] = useState("");
  const [recoveryEmailed, setRecoveryEmailed] = useState(false);

  const isLogin = mode === "login";

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setRecovery(false);
    setRecoverySent(false);
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          cuil,
          phone,
          department,
          position,
          reason,
          requestsEmployeeAccess: wantsEmployee,
        });
      }
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecovery() {
    setError("");
    setSubmitting(true);
    try {
      const ticket = await requestPasswordReset(email);
      // Respuesta genérica a propósito: no se revela si la cuenta existe.
      setRecoverySent(true);
      setRecoveryLink(ticket?.link ?? "");
      setRecoveryEmailed(ticket?.emailed ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el enlace.");
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
          paddingTop: insets.top + Spacing[6],
          paddingBottom: insets.bottom + Spacing[10],
          flexGrow: 1,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <ChatBotAvatar size={72} />
          <Text style={[styles.brandTitle, { color: C.ink }]}>ChatAP</Text>
          <Text style={[styles.brandSub, { color: C.muted }]}>
            Subsecretaría de Recursos Humanos · Formosa
          </Text>
        </View>

        <Card padded style={{ gap: Spacing[4], maxWidth: 460, width: "100%", alignSelf: "center" }}>
          {recovery ? (
            <>
              <Text style={[styles.title, { color: C.ink }]}>
                Recuperar contraseña
              </Text>

              {recoverySent ? (
                <>
                  <Text style={[styles.help, { color: C.muted }]}>
                    {recoveryEmailed
                      ? "Si existe una cuenta con ese correo, te mandamos un enlace para restablecer la contraseña. Vence en 1 hora."
                      : "Si existe una cuenta con ese correo, generamos un enlace válido por 1 hora."}
                  </Text>

                  {!recoveryEmailed && !!recoveryLink && (
                    <View style={styles.linkBox}>
                      <Text style={[styles.linkLabel, { color: C.faint }]}>
                        Enlace de recuperación (modo demostración)
                      </Text>
                      <Text style={[styles.linkText, { color: C.brandDeep }]} selectable>
                        {recoveryLink}
                      </Text>
                    </View>
                  )}

                  <Btn
                    label="Volver a iniciar sesión"
                    variant="ghost"
                    onPress={() => {
                      setRecovery(false);
                      setRecoverySent(false);
                    }}
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.help, { color: C.muted }]}>
                    Ingresá tu correo y te enviamos un enlace para crear una nueva
                    contraseña.
                  </Text>

                  <Field label="Correo electrónico" required>
                    <Input
                      value={email}
                      onChangeText={setEmail}
                      placeholder="tucorreo@ejemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </Field>

                  {!!error && <Text style={[styles.error, { color: C.bad }]}>{error}</Text>}

                  <Btn
                    label="Enviar enlace"
                    onPress={handleRecovery}
                    loading={submitting}
                  />
                  <Btn
                    label="Cancelar"
                    variant="ghost"
                    onPress={() => setRecovery(false)}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <View style={styles.tabs}>
                {(["login", "register"] as Mode[]).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => switchMode(m)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mode === m }}
                    style={[
                      styles.tab,
                      { borderBottomColor: mode === m ? C.brand : C.line },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: mode === m ? C.brand : C.muted },
                      ]}
                    >
                      {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {!isLogin && (
                <Field label="Nombre" required>
                  <Input
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej: Juan Pérez"
                    autoCapitalize="words"
                  />
                </Field>
              )}

              <Field label="Correo electrónico" required>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tucorreo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </Field>

              <Field label="Contraseña" required>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
                />
              </Field>

              {!isLogin && (
                <>
                  <Pressable
                    onPress={() => setWantsEmployee((v) => !v)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: wantsEmployee }}
                    style={styles.checkRow}
                  >
                    <Ionicons
                      name={wantsEmployee ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={wantsEmployee ? C.brand : C.faint}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkLabel, { color: C.ink }]}>
                        Solicito acceso como empleado
                      </Text>
                      <Text style={[styles.checkHint, { color: C.muted }]}>
                        Un Superadmin revisa el pedido antes de habilitarte el panel
                        interno.
                      </Text>
                    </View>
                  </Pressable>

                  {wantsEmployee && (
                    <>
                      <View style={{ flexDirection: "row", gap: Spacing[3] }}>
                        <View style={{ flex: 1 }}>
                          <Field label="CUIL" required>
                            <Input
                              value={cuil}
                              onChangeText={setCuil}
                              placeholder="20-12345678-3"
                              keyboardType="numbers-and-punctuation"
                            />
                          </Field>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Field label="Teléfono" required>
                            <Input
                              value={phone}
                              onChangeText={setPhone}
                              placeholder="3704 55-0000"
                              keyboardType="phone-pad"
                            />
                          </Field>
                        </View>
                      </View>

                      <Field label="Dependencia" required>
                        <Select
                          value={department}
                          options={employeeDepartments}
                          onChange={setDepartment}
                          placeholder="Elegí tu dependencia"
                        />
                      </Field>

                      <Field label="Puesto solicitado" required>
                        <Input
                          value={position}
                          onChangeText={setPosition}
                          placeholder="Ej: Administrativo"
                        />
                      </Field>

                      <Field label="Motivo">
                        <Input
                          value={reason}
                          onChangeText={setReason}
                          placeholder="Contanos por qué necesitás el acceso"
                          multiline
                          style={{ minHeight: 72, textAlignVertical: "top" }}
                        />
                      </Field>
                    </>
                  )}
                </>
              )}

              {!!error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={C.bad} />
                  <Text style={[styles.error, { color: C.bad, flex: 1 }]}>{error}</Text>
                </View>
              )}

              <Btn
                label={isLogin ? "Entrar" : "Crear cuenta"}
                onPress={handleSubmit}
                loading={submitting}
              />

              {isLogin && (
                <Pressable
                  onPress={() => {
                    setRecovery(true);
                    setError("");
                  }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.linkAction, { color: C.brandDeep }]}>
                    Olvidé mi contraseña
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </Card>

        <Pressable
          onPress={() => router.replace("/")}
          accessibilityRole="link"
          style={{ marginTop: Spacing[5] }}
        >
          <Text style={[styles.linkAction, { color: C.muted }]}>
            Volver al asistente
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: "center",
    gap: Spacing[1],
    marginBottom: Spacing[6],
  },
  brandTitle: {
    fontSize: Typography["2xl"],
    fontWeight: Typography.bold,
    marginTop: Spacing[2],
  },
  brandSub: {
    fontSize: Typography.sm,
    textAlign: "center",
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  help: {
    fontSize: Typography.base,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: "row",
    gap: Spacing[5],
  },
  tab: {
    paddingVertical: Spacing[2],
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  eye: {
    position: "absolute",
    right: Spacing[4],
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  checkLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  checkHint: {
    ...Type.meta,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  error: {
    ...Type.meta,
  },
  linkAction: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    textAlign: "center",
  },
  linkBox: {
    gap: Spacing[1],
  },
  linkLabel: {
    ...Type.metaStrong,
  },
  linkText: {
    ...Type.meta,
  },
});
