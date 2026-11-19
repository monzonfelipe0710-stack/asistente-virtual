import { useEffect } from "react";

import { Btn } from "@/compartido/ui/Btn";
import { Dialogo } from "@/compartido/ui/Dialogo";
import { Text } from "@/compartido/ui/Text";
import { useToast } from "@/compartido/ui/Toast";
import { Type, useColors } from "@/compartido/constantes/theme";
import { vibrarAlAdvertir } from "@/compartido/lib/haptica";

export function DialogoCerrarSesion({
  open,
  onClose,
  onConfirmar,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmar: () => Promise<void> | void;
}) {
  const C = useColors();
  const toast = useToast();

  useEffect(() => {
    if (open) vibrarAlAdvertir();
  }, [open]);

  async function confirmar() {
    onClose();
    await onConfirmar();
    toast("Sesión cerrada");
  }

  return (
    <Dialogo
      open={open}
      title="¿Querés cerrar la sesión?"
      onClose={onClose}
      footer={[
        <Btn key="no" label="Cancelar" variant="secondary" onPress={onClose} />,
        <Btn key="si" label="Cerrar sesión" variant="dangerFill" onPress={confirmar} />,
      ]}
    >
      <Text style={[Type.body, { color: C.ink }]}>
        Vas a salir de tu cuenta. Tus chats quedan guardados y los vas a ver cuando vuelvas a entrar.
      </Text>
    </Dialogo>
  );
}
