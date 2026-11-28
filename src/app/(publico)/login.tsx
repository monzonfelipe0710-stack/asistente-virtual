import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBotAvatar } from "@/compartido/avatar/ChatBotAvatar";
import { BotonVolver } from "@/compartido/ui/BotonVolver";
import { Btn } from "@/compartido/ui/Btn";
import { ScrollConTeclado } from "@/compartido/ui/Screen";
import { Segmented } from "@/compartido/ui/Segmented";
import { Field } from "@/compartido/ui/Field";
import { Input } from "@/compartido/ui/Input";
import { PasswordInput } from "@/compartido/ui/PasswordInput";
import { Select } from "@/compartido/ui/Select";
import { Text } from "@/compartido/ui/Text";
import { Spacing, Type, useColors } from "@/compartido/constantes/theme";
import { useAuth } from "@/compartido/sesion/AuthContext";
import { mensajeDeError, type GeneroApi } from "@/compartido/lib/backend";

type Mode = "login" | "register";

const COPY = {
  login: {
    title: "Ingresá a ChatAP",
    sub: "Ingresá con tu correo y tu contraseña.",
    submit: "Ingresar",
  },
  register: {
    title: "Creá tu cuenta",
    sub: "Completá los datos de tu DNI.",
    submit: "Crear cuenta",
  },
};

const OPCIONES_DE_GENERO = ["Masculino", "Femenino", "X"] as const;

type OpcionDeGenero = (typeof OPCIONES_DE_GENERO)[number];

const GENERO_PARA_API: Record<OpcionDeGenero, GeneroApi> = {
  Masculino: "M",
  Femenino: "F",
  X: "X",
};

function CuentaCreada({ mensaje, onIngresar }: { mensaje: string; onIngresar: () => void }) {
  const C = useColors();
  return (
    <>
      <View style={styles.centro}>
        <ChatBotAvatar size={72} />
        <Text style={[Type.pageTitle, { color: C.ink, textAlign: "center" }]}>Cuenta creada</Text>
        <Text style={[Type.lead, { color: C.ink2, textAlign: "center" }]}>{mensaje}</Text>
      </View>

      <View style={{ flex: 1, minHeight: Spacing[6] }} />
      <Btn label="Ingresar" onPress={onIngresar} />
    </>
  );
}

export default function LoginRegisterScreen() {
  const C = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isStaff, login, register } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [dni, setDni] = useState("");
  const [genero, setGenero] = useState<OpcionDeGenero | "">("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cuentaCreada, setCuentaCreada] = useState<string | null>(null);

  const isLogin = mode === "login";
  const copy = COPY[mode];
  const pideNombre = genero === "X";

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function iniciarSesion() {
    await login(email, password);
  }

  async function crearCuenta() {
    let generoParaApi: GeneroApi | "" = "";
    if (genero) {
      generoParaApi = GENERO_PARA_API[genero];
    }
    const mensaje = await register({ dni, genero: generoParaApi, nombre, apellido, email, password });
    setPassword("");
    setCuentaCreada(mensaje);
  }

  function irAIngresar() {
    setCuentaCreada(null);
    switchMode("login");
  }

  function volver() {
    if (cuentaCreada !== null) {
      irAIngresar();
    } else {
      router.replace("/");
    }
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
        await crearCuenta();
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
          etiqueta={cuentaCreada !== null ? "Volver" : "Volver al asistente"}
          onPress={volver}
        />

        {cuentaCreada !== null ? (
          <CuentaCreada mensaje={cuentaCreada} onIngresar={irAIngresar} />
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
                onChange={cambiarModoDesdeOpcion}
              />
            </View>

            <View style={styles.form}>
              {!isLogin && (
                <>
                  <Field label="DNI">
                    <Input
                      value={dni}
                      onChangeText={setDni}
                      placeholder="Sin puntos"
                      keyboardType="number-pad"
                      maxLength={8}
                    />
                  </Field>

                  <Field label="Género que figura en tu DNI">
                    <Select value={genero} options={OPCIONES_DE_GENERO} onChange={setGenero} />
                  </Field>

                  {pideNombre && (
                    <>
                      <Field label="Nombre">
                        <Input
                          value={nombre}
                          onChangeText={setNombre}
                          placeholder="Ana"
                          autoCapitalize="words"
                          autoComplete="given-name"
                        />
                      </Field>

                      <Field label="Apellido">
                        <Input
                          value={apellido}
                          onChangeText={setApellido}
                          placeholder="Pérez"
                          autoCapitalize="words"
                          autoComplete="family-name"
                        />
                      </Field>
                    </>
                  )}
                </>
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
                Verificamos tu DNI con el padrón de la Provincia. Si elegís X, también te pedimos tu
                nombre y apellido.
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
  footer: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
  },
});

export { ErrorBoundary } from "@/compartido/ui/PantallaConError";
