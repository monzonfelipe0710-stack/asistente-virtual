import { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Markdown, { MarkdownIt } from "react-native-markdown-display";

import { Text, useEscalaDeTexto } from "@/compartido/ui/Text";
import { Fonts, Radius, Spacing, useColors } from "@/compartido/constantes/theme";
import type { ChatMessage } from "@/funcionalidades/chat/tipos";
import { AccionesDeRespuesta } from "./AccionesDeRespuesta";
import { useAjustes } from "@/compartido/lib/accesibilidad";

// Cada paso vuelve a interpretar el Markdown y re-mide la burbuja (y con ella la lista): 50 pasos
// de 24 ms duran lo mismo que 100 de 12 ms con la mitad del trabajo.
const MS_POR_PASO = 24;

const PASOS_MAXIMOS = 50;

// [texto](url), con corchetes o paréntesis escapados adentro como los manda el server.
const ENLACE_MARKDOWN = /\[(?:\\.|[^\]\\])*\]\((?:\\.|[^)\\])*\)/g;

function rangosDeEnlaces(texto: string): [number, number][] {
  const rangos: [number, number][] = [];
  for (const enlace of texto.matchAll(ENLACE_MARKDOWN)) {
    rangos.push([enlace.index, enlace.index + enlace[0].length]);
  }
  return rangos;
}

// Un corte en medio de un enlace muestra "[Fuente oficial: Acci" y después la URL cruda hasta que
// se cierra el paréntesis. Si el corte cae adentro de uno, se muestra el enlace entero.
function corteSinPartirEnlaces(corte: number, rangos: [number, number][]): number {
  for (const [inicio, fin] of rangos) {
    if (corte > inicio && corte < fin) return fin;
  }
  return corte;
}

const REGLAS_MARKDOWN = { image: () => null };

// La librería trae estos tres como valores por defecto que se crean de nuevo en cada render, y eso
// le invalida el memo: cada paso del efecto de escritura armaba otro intérprete de Markdown y
// recalculaba todos los estilos. Pasados una sola vez, se reusan. Misma configuración que la suya.
// Los dos últimos existen en la librería pero no en sus tipos; por eso van en un objeto aparte.
const INTERPRETE_MARKDOWN = MarkdownIt({ typographer: true });
const PROPS_FIJAS_SIN_TIPO: object = { allowedImageHandlers: [], topLevelMaxExceededItem: null };

function esEnlaceWeb(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

// Las acciones (copiar, calificar, regenerar) van solo debajo de la última respuesta, cuando
// terminó de escribirse.
function MessageBubbleBase({
  message,
  escribiendo: pideEscribir = false,
  acciones,
}: {
  message: ChatMessage;
  escribiendo?: boolean;
  acciones?: {
    ocupado: boolean;
    onRegenerar: () => void;
    onCalificar: (id: number, calificacion: 0 | 1, motivo?: string) => Promise<void>;
  };
}) {
  const C = useColors();
  const escala = useEscalaDeTexto();
  const { reducirAnimaciones, letraLegible } = useAjustes();
  const escribiendo = pideEscribir && !reducirAnimaciones;
  const total = message.text.length;
  const enlaces = useMemo(() => rangosDeEnlaces(message.text), [message.text]);
  const [letras, setLetras] = useState(escribiendo ? 0 : total);

  useEffect(() => {
    if (!escribiendo || letras >= total) return;

    const paso = Math.max(2, Math.ceil(total / PASOS_MAXIMOS));
    const id = setTimeout(
      () => setLetras((n) => corteSinPartirEnlaces(Math.min(total, n + paso), enlaces)),
      MS_POR_PASO
    );
    return () => clearTimeout(id);
  }, [escribiendo, letras, total, enlaces]);

  const estiloMarkdown = useMemo(
    () => ({
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
        fontWeight: "normal" as const,
      },
      bullet_list: { marginBottom: Spacing[2] },
      ordered_list: { marginBottom: Spacing[2] },
    }),
    [C.ink, escala, letraLegible]
  );

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
          rules={REGLAS_MARKDOWN}
          markdownit={INTERPRETE_MARKDOWN}
          {...PROPS_FIJAS_SIN_TIPO}
          onLinkPress={esEnlaceWeb}
          style={estiloMarkdown}
        >
          {markdown}
        </Markdown>
      </View>
      {!!acciones && visibles >= total && (
        <AccionesDeRespuesta
          mensaje={message}
          ocupado={acciones.ocupado}
          onRegenerar={acciones.onRegenerar}
          onCalificar={acciones.onCalificar}
        />
      )}
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
