import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Btn } from "./Btn";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/constants/theme";

type Avisar = (detalle?: string) => void;

const AvisoContext = createContext<Avisar>(() => {});

/** Abre el aviso amistoso de "esta función todavía no está disponible". */
export function useAvisoNoDisponible(): Avisar {
  return useContext(AvisoContext);
}

/**
 * Reemplaza al mensaje seco de "falta el backend": una hoja con un ícono, una
 * explicación en palabras simples y un botón para cerrarla.
 */
export function AvisoNoDisponibleProvider({ children }: { children: ReactNode }) {
  const C = useColors();
  const [abierto, setAbierto] = useState(false);
  const [detalle, setDetalle] = useState<string | undefined>();

  const avisar = useCallback<Avisar>((nuevo) => {
    setDetalle(nuevo);
    setAbierto(true);
  }, []);

  return (
    <AvisoContext.Provider value={avisar}>
      {children}
      <Modal
        open={abierto}
        title="Todavía no disponible"
        onClose={() => setAbierto(false)}
        footer={<Btn label="Entendido" onPress={() => setAbierto(false)} />}
      >
        <View style={styles.cuerpo}>
          <View style={[styles.icono, { backgroundColor: C.infoBg, borderColor: C.info }]}>
            <Icon name="clock" size={32} color={C.info} />
          </View>
          <Text style={[Type.lead, { color: C.ink, textAlign: "center" }]}>
            {detalle ?? "Estamos terminando de conectar esta función."}
          </Text>
          <Text style={[Type.meta, { color: C.ink2, textAlign: "center" }]}>
            Probá de nuevo más adelante. No perdiste nada de lo que hiciste.
          </Text>
        </View>
      </Modal>
    </AvisoContext.Provider>
  );
}

const styles = StyleSheet.create({
  cuerpo: {
    alignItems: "center",
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  icono: {
    width: 72,
    height: 72,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
