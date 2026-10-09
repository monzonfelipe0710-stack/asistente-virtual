import { Redirect, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBotAvatar } from "@/components/avatar/ChatBotAvatar";
import { Btn } from "@/components/ui/Btn";
import { Field, Input } from "@/components/ui/Fields";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import {
  Motion,
  Radius,
  Shadows,
  Size,
  Spacing,
  Type,
  useColors,
} from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { employeeDepartments } from "@/data/mockEmployeeApprovals";

type Mode = "login" | "register";

const COPY = {
  login: {
    title: "Ingresá a ChatAP",
    sub: "Usá tu correo institucional o personal.",
    submit: "Continuar",
  },
  register: {
    title: "Creá tu cuenta",
    sub: "Guardá tus consultas y seguí tus trámites.",
    submit: "Crear cuenta",
  },
  recovery: {
    title: "Recuperá tu acceso",
    sub: "Te enviamos un enlace para crear una contraseña nueva.",
    submit: "Enviar enlace",
  },
};

/** Campo de contraseña: el ojo es un botón de 44 dentro del campo de 52. */
function PasswordInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const C = useColors();
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoComplete="password"
        style={{ paddingRight: 52 }}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        style={styles.eye}
      >
        {({ pressed }) => (
          <Icon
            name={visible ? "eyeOff" : "eye"}
            size={20}
            color={pressed ? C.ink : C.ink3}
          />
        )}
      </Pressable>
    </View>
  );
}

/** Iniciar sesión / Crear cuenta: pista gris en píldora y pastilla que se desliza. */
function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const C = useColors();
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(mode === "register" ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(x, {
      toValue: mode === "register" ? 1 : 0,
      duration: 280,
      easing: Easing.bezier(...Motion.bezier),
      useNativeDriver: true,
    }).start();
  }, [mode, x]);

  const half = Math.max(0, (width - 8) / 2);

  return (
    <View
      style={[styles.switch, { backgroundColor: C.surface }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            C.thumb === "#FFFFFF" && Shadows.sm,
            {
              width: half,
              backgroundColor: C.thumb,
              transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, half] }) }],
            },
          ]}
        />
      )}
      {(["login", "register"] as Mode[]).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === m }}
          style={styles.switchOption}
        >
          <Text
            style={{ fontSize: 14, fontWeight: "500", color: mode === m ? C.ink : C.ink2 }}
          >
            {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function LoginRegisterScreen() {
  const C = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isStaff, login, register, requestPasswordReset } = useAuth();

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
  const copy = recovery ? COPY.recovery : COPY[mode];

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

  // Con una sesión abierta no hay nada que hacer acá: staff al panel, el resto al asistente.
  if (user) return <Redirect href={isStaff ? "/admin" : "/"} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: C.canvas }}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Volver arriba a la izquierda, con el ícono sobre la línea de 20 */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.replace("/")}
            accessibilityRole="button"
            accessibilityLabel="Volver al asistente"
            style={({ pressed }) => [
              styles.back,
              pressed && { backgroundColor: C.surface },
            ]}
          >
            <Icon name="chevronLeft" size={22} color={C.ink} />
          </Pressable>
        </View>

        <View style={{ marginTop: Spacing[4], alignSelf: "flex-start" }}>
          <ChatBotAvatar size={48} tight />
        </View>
        <Text style={[Type.pageTitle, { color: C.ink, marginTop: Spacing[6] }]}>
          {copy.title}
        </Text>
        <Text style={[Type.lead, { color: C.ink2, marginTop: Spacing[2] }]}>
          {copy.sub}
        </Text>

        {!recovery && (
          <View style={{ marginTop: Spacing[8] }}>
            <ModeSwitch mode={mode} onChange={switchMode} />
          </View>
        )}

        {recovery && recoverySent && (
          <View style={[styles.sent, { backgroundColor: C.surface }]}>
            <View style={[styles.sentIcon, { backgroundColor: C.okBg }]}>
              <Icon name="check" size={18} color={C.ok} strokeWidth={2.6} />
            </View>
            <View style={{ flex: 1, gap: Spacing[1] }}>
              <Text style={[Type.bodyStrong, { color: C.ink }]}>Revisá tu correo</Text>
              <Text style={[Type.label, { fontWeight: "400", color: C.ink2 }]}>
                {recoveryEmailed
                  ? `Si ${email} tiene una cuenta, vas a recibir el enlace en unos minutos. Vence en 1 hora.`
                  : `Si ${email} tiene una cuenta, generamos un enlace válido por 1 hora.`}
              </Text>
              {!recoveryEmailed && !!recoveryLink && (
                <View style={{ marginTop: Spacing[2], gap: 2 }}>
                  <Text style={[Type.overline, { color: C.ink3 }]}>Modo demostración</Text>
                  <Text style={[Type.meta, { color: C.accentText }]} selectable>
                    {recoveryLink}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {!(recovery && recoverySent) && (
          <View style={styles.form}>
            {!isLogin && !recovery && (
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

            {!recovery && (
              <Field label="Contraseña">
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isLogin ? "Tu contraseña" : "Mínimo 6 caracteres"}
                />
              </Field>
            )}

            {!isLogin && !recovery && (
              <>
                <Pressable
                  onPress={() => setWantsEmployee((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: wantsEmployee }}
                  style={styles.checkRow}
                >
                  <View
                    style={[
                      styles.check,
                      wantsEmployee
                        ? { backgroundColor: C.accent, borderColor: C.accent }
                        : { borderColor: C.ink3 },
                    ]}
                  >
                    {wantsEmployee && (
                      <Icon name="check" size={14} color="#FFFFFF" strokeWidth={3} />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[Type.body, { fontWeight: "500", color: C.ink }]}>
                      Solicito acceso como empleado
                    </Text>
                    <Text style={[Type.meta, { color: C.ink2 }]}>
                      Un Superadmin revisa el pedido antes de habilitarte el panel
                      interno.
                    </Text>
                  </View>
                </Pressable>

                {wantsEmployee && (
                  <>
                    <View style={styles.pair}>
                      <View style={{ flex: 1 }}>
                        <Field label="CUIL">
                          <Input
                            value={cuil}
                            onChangeText={setCuil}
                            placeholder="20-12345678-3"
                            keyboardType="numbers-and-punctuation"
                          />
                        </Field>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Field label="Teléfono">
                          <Input
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="3704 55-0000"
                            keyboardType="phone-pad"
                          />
                        </Field>
                      </View>
                    </View>

                    <Field label="Dependencia">
                      <Select
                        value={department}
                        options={employeeDepartments}
                        onChange={setDepartment}
                        placeholder="Elegí tu dependencia"
                      />
                    </Field>

                    <Field label="Puesto solicitado">
                      <Input
                        value={position}
                        onChangeText={setPosition}
                        placeholder="Ej.: Administrativo"
                      />
                    </Field>

                    <Field label="Motivo">
                      <Input
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Contanos por qué necesitás el acceso"
                        multiline
                      />
                    </Field>
                  </>
                )}
              </>
            )}

            {!!error && (
              <Text
                style={[Type.meta, { color: C.danger }]}
                accessibilityLiveRegion="polite"
              >
                {error}
              </Text>
            )}
          </View>
        )}

        {isLogin && !recovery && (
          <Pressable
            onPress={() => {
              setRecovery(true);
              setError("");
            }}
            accessibilityRole="button"
            style={styles.forgot}
          >
            {({ pressed }) => (
              <Text
                style={[Type.label, { color: C.accentText, opacity: pressed ? 0.6 : 1 }]}
              >
                ¿Olvidaste tu contraseña?
              </Text>
            )}
          </Pressable>
        )}

        {!(recovery && recoverySent) && (
          <Btn
            label={copy.submit}
            onPress={recovery ? handleRecovery : handleSubmit}
            loading={submitting}
            style={{ marginTop: Spacing[6] }}
          />
        )}

        {recovery && (
          <Btn
            label="Volver a iniciar sesión"
            variant="secondary"
            onPress={() => {
              setRecovery(false);
              setRecoverySent(false);
              setError("");
            }}
            style={{ marginTop: Spacing[3] }}
          />
        )}

        <View style={{ flex: 1, minHeight: Spacing[6] }} />
        <Text
          style={[
            styles.footer,
            { color: C.ink3, paddingBottom: Math.max(insets.bottom, Spacing[5]) + Spacing[3] },
          ]}
        >
          Subsecretaría de Recursos Humanos · Formosa
        </Text>
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
  switch: {
    flexDirection: "row",
    height: Size.touch,
    borderRadius: 999,
    padding: 4,
  },
  thumb: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 999,
  },
  switchOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[4],
    marginTop: Spacing[8],
    padding: Spacing[5],
    borderRadius: Radius.xl,
  },
  sentIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: Spacing[4],
    marginTop: Spacing[6],
  },
  eye: {
    position: "absolute",
    right: 4,
    top: 4,
    width: Size.touch,
    height: Size.touch,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing[3],
    paddingVertical: Spacing[1],
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  pair: {
    flexDirection: "row",
    gap: Spacing[3],
  },
  forgot: {
    alignSelf: "flex-end",
    height: Size.touch,
    justifyContent: "center",
    marginTop: Spacing[1],
  },
  footer: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});
