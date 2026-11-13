import { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { Text, useEscalaDeTexto } from "@/compartido/ui/Text";
import { Fonts, Radius, Spacing, useColors } from "@/compartido/constantes/theme";
import type { ChatMessage } from "@/funcionalidades/chat/tipos";
import { useAjustes } from "@/compartido/lib/accesibilidad";

const MS_POR_PASO = 12;

const PASOS_MAXIMOS = 100;

function MessageBubbleBase({
  message,
  escribiendo: pideEscribir = false,
}: {
  message: ChatMessage;
  escribiendo?: boolean;
}) {
  const C = useColors();
  const escala = useEscalaDeTexto();
  const { reducirAnimaciones, letraLegible } = useAjustes();
  const escribiendo = pideEscribir && !reducirAnimaciones;
  const total = message.text.length;
  const [letras, setLetras] = useState(escribiendo ? 0 : total);

  useEffect(() => {
    if (!escribiendo || letras >= total) return;

    const paso = Math.max(2, Math.ceil(total / PASOS_MAXIMOS));
    const id = setTimeout(() => setLetras((n) => Math.min(total, n + paso)), MS_POR_PASO);
    return () => clearTimeout(id);
  }, [escribiendo, letras, total]);

  const visibles = escribiendo ? letras : total;
  const parcial = message.text.slice(0, visibles);
  const markdown = (parcial.match(/\*\*/g)?.length ?? 0) % 2 ? `${parcial}**` : parcial;

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
      <View style={styles.markdown} accessible accessibilityLabel={message.text}>
        <Markdown
          style={{
            body: {
              color: C.ink,
              fontFamily: letraLegible ? Fonts.legible : Fonts.regular,
              fontSize: 17 * escala,
              lineHeight: 25 * escala * (letraLegible ? 1.15 : 1),
              letterSpacing: letraLegible ? 0.3 : 0,
            },
            paragraph: { marginTop: 0, marginBottom: Spacing[2] },
            strong: {
              fontFamily: letraLegible ? Fonts.legibleNegrita : Fonts.bold,
              fontWeight: "normal",
            },
            bullet_list: { marginBottom: Spacing[2] },
            ordered_list: { marginBottom: Spacing[2] },
          }}
        >
          {markdown}
        </Markdown>
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleBase);

const styles = StyleSheet.create({
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
    maxWidth: "85%",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius["2xl"] + 4,
  },
  markdown: {
    alignSelf: "stretch",
  },
  texto: {
    fontSize: 17,
    lineHeight: 25,
  },
});
