import { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../common/Text";
import { Palette, Radius, Spacing, useColors } from "../../constants/theme";
import { ChatMessage } from "../../data/mockMessages";
import ChatBotAvatar from "../ChatBotAvatar";

interface Props {
  message: ChatMessage;
  /** Escribe el texto letra a letra (18 ms por paso). Solo el último mensaje. */
  typewriter?: boolean;
}

/**
 * Usuario: burbuja gris a la derecha, radio 20, 10 × 16, máx. 80 %.
 * Bot: sin burbuja y a ancho completo, con el avatar de 28 arriba.
 */
function MessageBubble({ message, typewriter = false }: Props) {
  const C = useColors();
  const styles = useMemo(() => createStyles(C), [C]);
  const isBot = message.type === "bot";
  const full = message.text.length;
  const [shown, setShown] = useState(typewriter && isBot ? 0 : full);

  useEffect(() => {
    if (!typewriter || !isBot) return;
    // textos largos avanzan de a dos para no tardar más de unos segundos
    const step = full > 200 ? 2 : 1;
    const id = setInterval(() => {
      setShown((n) => {
        const next = Math.min(full, n + step);
        if (next >= full) clearInterval(id);
        return next;
      });
    }, 18);
    return () => clearInterval(id);
  }, [typewriter, isBot, full]);

  if (!isBot) {
    return (
      <View style={styles.rowUser}>
        <View style={styles.bubbleUser}>
          <Text style={styles.text}>{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowBot}>
      <ChatBotAvatar size={28} tight static />
      <Text style={styles.text} accessibilityLabel={message.text}>
        {message.text.slice(0, shown)}
      </Text>
    </View>
  );
}

export default memo(MessageBubble);

const createStyles = (C: Palette) =>
  StyleSheet.create({
    // marginTop y no marginBottom: así el último mensaje no deja hueco sobre el input
    rowUser: {
      marginTop: Spacing[6],
      paddingHorizontal: Spacing[5],
      alignItems: "flex-end",
    },
    rowBot: {
      marginTop: Spacing[6],
      paddingHorizontal: Spacing[5],
      gap: Spacing[3],
      alignItems: "flex-start",
    },
    bubbleUser: {
      maxWidth: "80%",
      paddingHorizontal: Spacing[4],
      paddingVertical: 10,
      backgroundColor: C.bubble,
      borderRadius: Radius["2xl"],
    },
    text: {
      fontSize: 16,
      lineHeight: 24,
      color: C.ink,
    },
  });
