import { Children, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "./Text";

import { BottomSheet, useArrastreDeLaHoja } from "./BottomSheet";
import { Icon } from "./Icon";
import { ScrollConTeclado } from "./Screen";
import { Spacing, Type, useColors } from "@/compartido/constantes/theme";

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <Contenido title={title} onClose={onClose} footer={footer}>
        {children}
      </Contenido>
    </BottomSheet>
  );
}

function Contenido({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const C = useColors();
  const actions = Children.toArray(footer);
  const arrastre = useArrastreDeLaHoja();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flexShrink}
    >
      <View style={styles.titulo} {...arrastre}>
        <Text style={[Type.sheetTitle, styles.tituloTexto, { color: C.ink }]} accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          style={({ pressed }) => [styles.cerrar, pressed && { backgroundColor: C.surface2 }]}
        >
          <Icon name="close" size={24} color={C.ink} />
        </Pressable>
      </View>

      <ScrollConTeclado
        conEspacio={false}
        style={styles.flexShrink}
        contentContainerStyle={styles.body}
      >
        {children}
      </ScrollConTeclado>

      {actions.length > 0 && (
        <View style={styles.footer}>
          {actions.map((a, i) => (
            <View key={i} style={styles.action}>
              {a}
            </View>
          ))}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexShrink: {
    flexShrink: 1,
  },
  titulo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -Spacing[3],
  },
  tituloTexto: {
    flex: 1,
  },
  cerrar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingTop: Spacing[4],
    gap: Spacing[4],
  },
  footer: {
    flexDirection: "row",
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  action: {
    flex: 1,
  },
});
