import { Pressable, StyleSheet, View } from "react-native";

import { Btn } from "@/components/ui/Btn";
import { Modal } from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import {
  Radius,
  setColorScheme,
  Spacing,
  Type,
  useColors,
  useColorScheme,
  Weight,
} from "@/constants/theme";
import {
  AJUSTES_POR_DEFECTO,
  cambiarAjustes,
  ESCALAS,
  useAjustes,
  type Ajustes,
  type TamanoDeTexto,
} from "@/lib/accesibilidad";
import { vibrarAlConfirmar, vibrarAlElegir } from "@/lib/haptica";

const TAMANOS = Object.keys(ESCALAS) as TamanoDeTexto[];
const TAMANO_DE_LA_A = [16, 19, 23, 28];

const INTERRUPTORES: {
  clave: "altoContraste" | "letraLegible" | "reducirAnimaciones" | "vibracion";
  titulo: string;
  pista: string;
}[] = [
  { clave: "altoContraste", titulo: "Alto contraste", pista: "Negro y blanco puros, bordes marcados." },
  { clave: "letraLegible", titulo: "Letra más legible", pista: "Tipografía más abierta y espaciada." },
  { clave: "reducirAnimaciones", titulo: "Reducir animaciones", pista: "Sin movimiento ni escritura letra a letra." },
  { clave: "vibracion", titulo: "Vibración", pista: "Una vibración corta al mantener apretado y al confirmar." },
];

function Interruptor({
  titulo,
  pista,
  valor,
  onPress,
}: {
  titulo: string;
  pista: string;
  valor: boolean;
  onPress: () => void;
}) {
  const C = useColors();
  return (
    <Pressable
      onPress={() => {
        onPress();
        vibrarAlElegir();
      }}
      accessibilityRole="switch"
      accessibilityLabel={titulo}
      accessibilityState={{ checked: valor }}
      style={[styles.interruptor, { backgroundColor: C.surface, borderColor: C.border }]}
    >
      <View style={styles.interruptorTexto}>
        <Text style={[Type.rowTitle, { color: C.ink }]}>{titulo}</Text>
        <Text style={[Type.meta, { color: C.ink2 }]}>{pista}</Text>
      </View>
      <Toggle value={valor} />
    </Pressable>
  );
}

/** Ventana de accesibilidad: tamaño del texto, modo oscuro, contraste, legibilidad y movimiento. */
export function VentanaAccesibilidad({ open, onClose }: { open: boolean; onClose: () => void }) {
  const C = useColors();
  const ajustes = useAjustes();
  const oscuro = useColorScheme() === "dark";
  const sinCambios =
    !oscuro &&
    (Object.keys(AJUSTES_POR_DEFECTO) as (keyof Ajustes)[]).every(
      (clave) => ajustes[clave] === AJUSTES_POR_DEFECTO[clave],
    );

  return (
    <Modal
      open={open}
      title="Accesibilidad"
      onClose={onClose}
      footer={
        <Btn
          label="Restablecer"
          variant="secondary"
          size="md"
          disabled={sinCambios}
          onPress={() => {
            cambiarAjustes(AJUSTES_POR_DEFECTO);
            setColorScheme("light");
            vibrarAlConfirmar();
          }}
        />
      }
    >
      <View style={styles.tamanos}>
        <Text style={[Type.bodyStrong, { color: C.ink }]}>Tamaño del texto</Text>
        <View style={styles.tamanosFila}>
          {TAMANOS.map((tamano, indice) => {
            const activo = tamano === ajustes.tamanoDeTexto;
            return (
              <Pressable
                key={tamano}
                onPress={() => {
                  cambiarAjustes({ tamanoDeTexto: tamano });
                  vibrarAlElegir();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Tamaño del texto: ${tamano}`}
                accessibilityState={{ selected: activo }}
                style={[
                  styles.tamano,
                  activo
                    ? { backgroundColor: C.accent, borderColor: C.accent, borderWidth: 2 }
                    : { backgroundColor: C.surface, borderColor: C.borderStrong },
                ]}
              >
                <Text
                  style={{
                    fontSize: TAMANO_DE_LA_A[indice],
                    lineHeight: TAMANO_DE_LA_A[indice] + 4,
                    fontWeight: Weight.bold,
                    color: activo ? C.onAccent : C.ink,
                  }}
                >
                  A
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[Type.meta, { color: C.ink2 }]}>Actual: {ajustes.tamanoDeTexto}</Text>
      </View>

      <View style={styles.interruptores}>
        <Interruptor
          titulo="Modo oscuro"
          pista="Gris suave, cómodo con poca luz."
          valor={oscuro}
          onPress={() => setColorScheme(oscuro ? "light" : "dark")}
        />
        {INTERRUPTORES.map(({ clave, titulo, pista }) => (
          <Interruptor
            key={clave}
            titulo={titulo}
            pista={pista}
            valor={ajustes[clave]}
            onPress={() => cambiarAjustes({ [clave]: !ajustes[clave] })}
          />
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tamanos: {
    gap: Spacing[2],
  },
  tamanosFila: {
    flexDirection: "row",
    gap: Spacing[2],
  },
  tamano: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.button,
    borderWidth: 1,
  },
  interruptores: {
    gap: Spacing[3],
  },
  interruptor: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    minHeight: 64,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius["2xl"],
    borderWidth: 1,
  },
  interruptorTexto: {
    flex: 1,
    minWidth: 0,
  },
});
