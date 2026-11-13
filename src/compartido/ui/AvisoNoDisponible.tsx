import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Btn } from "./Btn";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { Text } from "./Text";
import { Spacing, Type, useColors } from "@/compartido/constantes/theme";

type Avisar = () => void;

const AvisoContext = createContext<Avisar>(() => {});

export function useAvisoNoDisponible(): Avisar {
  return useContext(AvisoContext);
}

export function AvisoNoDisponibleProvider({ children }: { children: ReactNode }) {
  const C = useColors();
  const [abierto, setAbierto] = useState(false);

  const avisar = useCallback<Avisar>(() => {
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
            Estamos terminando de conectar esta función.
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
