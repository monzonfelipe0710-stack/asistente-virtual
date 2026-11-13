import { useRouter } from "expo-router";

import { Btn } from "@/compartido/ui/Btn";
import { PantallaAviso } from "@/compartido/ui/PantallaAviso";

export default function NoEncontrada() {
  const router = useRouter();

  return (
    <PantallaAviso
      icono="alert"
      titulo="Pantalla no encontrada"
      texto="La dirección que abriste no existe en ChatAP."
    >
      <Btn label="Volver al asistente" onPress={() => router.replace("/")} />
    </PantallaAviso>
  );
}
