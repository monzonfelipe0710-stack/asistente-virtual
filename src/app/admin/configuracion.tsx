import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/Text";

import { Radius, Spacing, Type, useColors } from "@/constants/theme";
import { Toggle } from "@/components/ui/Toggle";
import { useToast } from "@/components/ui/Toast";
import { Btn } from "@/components/ui/Btn";
import { Field, Input } from "@/components/ui/Fields";
import { SkeletonList } from "@/components/ui/Lists";
import { Screen, PageHeader } from "@/components/ui/Screen";
import { Select } from "@/components/ui/Select";

const WORKING_HOURS = [
  "24/7 — Todos los días",
  "08:00 — 18:00 hs",
  "08:00 — 20:00 hs",
  "09:00 — 17:00 hs",
] as const;

type WorkingHours = (typeof WORKING_HOURS)[number];

interface Settings {
  name: string;
  welcomeMessage: string;
  secondaryMessage: string;
  autoResponse: boolean;
  workingHours: WorkingHours;
  department: string;
}

const DEFAULTS: Settings = {
  name: "ChatAP",
  welcomeMessage:
    "¡Hola! Soy ChatAP, el asistente virtual de la Subsecretaría de Recursos Humanos. Estoy acá para ayudarte con tus consultas sobre licencias, haberes, trámites y más. ¿En qué puedo ayudarte hoy?",
  secondaryMessage:
    "Podés preguntarme sobre licencias, recibos de haberes, trámites, o escribir 'menú' para ver todas las opciones disponibles.",
  autoResponse: true,
  workingHours: "24/7 — Todos los días",
  department: "Subsecretaría de Recursos Humanos",
};

export default function ChatbotSettings() {
  const C = useColors();
  const push = useToast();

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <Screen>
        <View>
          <SkeletonList rows={5} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title="Configuración"
        description="Comportamiento y mensajes del asistente."
      />

      <View style={styles.form}>
        {/* Interruptores agrupados en una superficie: la fila entera es el área táctil */}
        <View style={[styles.group, { backgroundColor: C.surface }]}>
          <Pressable
            onPress={() => setSettings((s) => ({ ...s, autoResponse: !s.autoResponse }))}
            accessibilityRole="switch"
            accessibilityState={{ checked: settings.autoResponse }}
            style={styles.toggleRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: C.ink }]}>Respuestas automáticas</Text>
              <Text style={[Type.meta, { color: C.ink2 }]}>
                El asistente responde solo, con la base de conocimiento.
              </Text>
            </View>
            <Toggle value={settings.autoResponse} />
          </Pressable>
        </View>

        <Field label="Horario de atención">
          <Select
            value={settings.workingHours}
            options={WORKING_HOURS}
            onChange={(workingHours) => setSettings((s) => ({ ...s, workingHours }))}
          />
        </Field>

        <Field label="Nombre del asistente">
          <Input
            value={settings.name}
            onChangeText={(name) => setSettings((s) => ({ ...s, name }))}
          />
        </Field>

        <Field label="Mensaje de bienvenida">
          <Input
            value={settings.welcomeMessage}
            onChangeText={(welcomeMessage) =>
              setSettings((s) => ({ ...s, welcomeMessage }))
            }
            multiline
            style={{ minHeight: 120 }}
          />
        </Field>

        <Field label="Mensaje secundario">
          <Input
            value={settings.secondaryMessage}
            onChangeText={(secondaryMessage) =>
              setSettings((s) => ({ ...s, secondaryMessage }))
            }
            multiline
          />
        </Field>

        <Field label="Dependencia">
          <Input
            value={settings.department}
            onChangeText={(department) => setSettings((s) => ({ ...s, department }))}
          />
        </Field>

        <Btn
          label="Guardar cambios"
          onPress={() => push("Configuración guardada")}
        />
        <Btn
          label="Restablecer valores"
          variant="ghost"
          onPress={() => {
            setSettings(DEFAULTS);
            push("Se restablecieron los valores por defecto");
          }}
          style={{ alignSelf: "center", marginTop: -Spacing[2] }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing[6],
  },
  group: {
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[4],
    paddingVertical: 14,
    paddingHorizontal: Spacing[4],
  },
  toggleLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
  },
});
