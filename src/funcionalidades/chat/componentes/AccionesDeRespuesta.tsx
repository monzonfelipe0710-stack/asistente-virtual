import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Spacing, Type, useColors } from "@/compartido/constantes/theme";
import { mensajeDeError } from "@/compartido/lib/backend";
import { vibrarAlConfirmar, vibrarAlElegir } from "@/compartido/lib/haptica";
import { useAuth } from "@/compartido/sesion/AuthContext";
import { Btn } from "@/compartido/ui/Btn";
import { Icon, type IconName } from "@/compartido/ui/Icon";
import { Input } from "@/compartido/ui/Input";
import { Modal } from "@/compartido/ui/Modal";
import { Text } from "@/compartido/ui/Text";
import { useToast } from "@/compartido/ui/Toast";
import type { ChatMessage } from "@/funcionalidades/chat/tipos";

// Los mismos que ofrece el front web; el server cuenta cualquier otro texto como "Otro motivo".
const OTRO_MOTIVO = "Otro motivo";
const MOTIVOS_NO_UTIL = [
  "No respondió mi pregunta",
  "La información no es correcta",
  "La respuesta fue confusa",
  "No era lo que buscaba",
  OTRO_MOTIVO,
];
const LARGO_MAXIMO_DEL_MOTIVO = 300;

// El texto se copia sin la sintaxis de Markdown: los enlaces quedan como "texto (url)".
function textoParaCopiar(texto: string) {
  return texto
    .replace(/\[((?:\\.|[^\]\\])*)\]\(((?:\\.|[^)\\])*)\)/g, "$1 ($2)")
    .replace(/\*\*/g, "")
    .replace(/\\([[\]\\<>()])/g, "$1");
}

function BotonDeAccion({
  icono,
  etiqueta,
  onPress,
  deshabilitado = false,
  elegido = false,
}: {
  icono: IconName;
  etiqueta: string;
  onPress: () => void;
  deshabilitado?: boolean;
  elegido?: boolean;
}) {
  const C = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: deshabilitado, selected: elegido }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.boton,
        elegido && { backgroundColor: C.activeBg },
        pressed && !elegido && { backgroundColor: C.surface2 },
        deshabilitado && !elegido && { opacity: 0.4 },
      ]}
    >
      <Icon name={icono} size={20} color={elegido ? C.activeInk : C.ink2} />
    </Pressable>
  );
}

export function AccionesDeRespuesta({
  mensaje,
  ocupado,
  onRegenerar,
  onCalificar,
}: {
  mensaje: ChatMessage;
  ocupado: boolean;
  onRegenerar: () => void;
  onCalificar: (id: number, calificacion: 0 | 1, motivo?: string) => Promise<void>;
}) {
  const C = useColors();
  const toast = useToast();
  const { user } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [eligiendoMotivo, setEligiendoMotivo] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [detalle, setDetalle] = useState("");

  const calificada = mensaje.calificacion === 0 || mensaje.calificacion === 1;
  const puedeCalificar = !!mensaje.consultaId && (!!mensaje.calificarToken || !!user);
  const pideDetalle = motivo === OTRO_MOTIVO;

  async function copiar() {
    vibrarAlElegir();
    try {
      await Clipboard.setStringAsync(textoParaCopiar(mensaje.text));
      toast("Respuesta copiada");
    } catch {
      toast("No se pudo copiar la respuesta.");
    }
  }

  async function calificar(valor: 0 | 1, motivoElegido?: string) {
    setEnviando(true);
    try {
      await onCalificar(mensaje.id, valor, motivoElegido);
      vibrarAlConfirmar();
      setEligiendoMotivo(false);
      toast(valor === 1 ? "¡Gracias por tu opinión!" : "Gracias, nos ayuda a mejorar.");
    } catch (e) {
      toast(mensajeDeError(e, "No se pudo guardar tu opinión."));
    } finally {
      setEnviando(false);
    }
  }

  function abrirMotivos() {
    vibrarAlElegir();
    setMotivo("");
    setDetalle("");
    setEligiendoMotivo(true);
  }

  function enviarMotivo() {
    const texto = pideDetalle ? detalle.trim() || OTRO_MOTIVO : motivo;
    calificar(0, texto);
  }

  return (
    <View style={styles.fila}>
      <BotonDeAccion icono="copy" etiqueta="Copiar respuesta" onPress={copiar} />
      {puedeCalificar && (
        <>
          <BotonDeAccion
            icono="thumbUp"
            etiqueta="Me sirvió"
            onPress={() => {
              vibrarAlElegir();
              calificar(1);
            }}
            deshabilitado={calificada || enviando}
            elegido={mensaje.calificacion === 1}
          />
          <BotonDeAccion
            icono="thumbDown"
            etiqueta="No me sirvió"
            onPress={abrirMotivos}
            deshabilitado={calificada || enviando}
            elegido={mensaje.calificacion === 0}
          />
        </>
      )}
      <BotonDeAccion icono="sync" etiqueta="Regenerar respuesta" onPress={onRegenerar} deshabilitado={ocupado} />

      <Modal
        open={eligiendoMotivo}
        title="¿Qué no te sirvió?"
        onClose={() => setEligiendoMotivo(false)}
        footer={[
          <Btn key="cancelar" label="Cancelar" variant="secondary" onPress={() => setEligiendoMotivo(false)} />,
          <Btn key="enviar" label="Enviar" onPress={enviarMotivo} disabled={!motivo} loading={enviando} />,
        ]}
      >
        <View accessibilityRole="radiogroup">
          {MOTIVOS_NO_UTIL.map((opcion) => {
            const elegida = opcion === motivo;
            return (
              <Pressable
                key={opcion}
                onPress={() => setMotivo(opcion)}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegida }}
                style={({ pressed }) => [
                  styles.motivo,
                  { borderBottomColor: C.border },
                  pressed && { backgroundColor: C.surface2 },
                ]}
              >
                <Text style={[Type.body, styles.motivoTexto, { color: C.ink }]}>{opcion}</Text>
                {elegida && <Icon name="check" size={22} color={C.accent} />}
              </Pressable>
            );
          })}
        </View>
        {pideDetalle && (
          <Input
            value={detalle}
            onChangeText={setDetalle}
            placeholder="Contanos qué pasó (opcional)"
            maxLength={LARGO_MAXIMO_DEL_MOTIVO}
            multiline
            autoFocus
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[1],
    marginTop: -Spacing[1],
    marginLeft: -Spacing[2],
  },
  boton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  motivo: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    borderBottomWidth: 1,
  },
  motivoTexto: {
    flex: 1,
  },
});
