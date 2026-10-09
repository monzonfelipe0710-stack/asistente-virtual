import { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ChatBotAvatar } from "@/components/avatar/ChatBotAvatar";
import { Text } from "@/components/ui/Text";
import { Radius, Spacing, useColors } from "@/constants/theme";
import type { ChatMessage } from "@/data/mockMessages";

/** Milisegundos entre una letra y la siguiente. */
const MS_POR_PASO = 18;

/**
 * Usuario: burbuja gris a la derecha, radio 20, máximo 80 % del ancho.
 * Asistente: sin burbuja y a ancho completo, con su avatar arriba.
 * Si `escribiendo` es verdadero, el texto del asistente aparece letra a letra.
 */
function MessageBubbleBase({
  message,
  escribiendo = false,
}: {
  message: ChatMessage;
  escribiendo?: boolean;
}) {
  const C = useColors();
  const total = message.text.length;
  const [letras, setLetras] = useState(escribiendo ? 0 : total);

  useEffect(() => {
    if (!escribiendo || letras >= total) return;

    // Los textos largos avanzan de a dos para no tardar más de unos segundos.
    const paso = total > 200 ? 2 : 1;
    const id = setTimeout(() => setLetras((n) => Math.min(total, n + paso)), MS_POR_PASO);
    return () => clearTimeout(id);
  }, [escribiendo, letras, total]);

  if (message.type === "user") {
    return (
      <View style={styles.filaUsuario}>
        <View style={[styles.burbuja, { backgroundColor: C.bubble }]}>
          <Text style={[styles.texto, { color: C.ink }]}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.filaAsistente}>
      <ChatBotAvatar size={28} tight static />
      <Text style={[styles.texto, { color: C.ink }]} accessibilityLabel={message.text}>
        {message.text.slice(0, letras)}
      </Text>
    </View>
  );
}

// memo: cada tecla del campo re-renderiza el chat; los mensajes ya escritos no cambian.
export const MessageBubble = memo(MessageBubbleBase);

const styles = StyleSheet.create({
  // marginTop y no marginBottom: así el último mensaje no deja hueco sobre el campo.
  filaUsuario: {
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[5],
    alignItems: "flex-end",
  },
  filaAsistente: {
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
    alignItems: "flex-start",
  },
  burbuja: {
    maxWidth: "80%",
    paddingHorizontal: Spacing[4],
    paddingVertical: 10,
    borderRadius: Radius["2xl"],
  },
  texto: {
    fontSize: 16,
    lineHeight: 24,
  },
});
