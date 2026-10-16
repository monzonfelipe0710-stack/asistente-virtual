import { Drawer, type DrawerContentComponentProps } from "expo-router/drawer";
import { useState } from "react";
import { useWindowDimensions } from "react-native";

import { cerrarMenu, MenuLateral, type SeccionDeMenu } from "@/components/menu/MenuLateral";
import { opcionesDelMenu } from "@/components/menu/opcionesDelMenu";
import { PieCiudadano } from "@/components/menu/PieCiudadano";
import { VentanaAccesibilidad } from "@/components/menu/VentanaAccesibilidad";
import { useColors } from "@/constants/theme";
import { ChatProvider, useConversacion } from "@/context/ChatContext";

function MenuCiudadano({
  drawer,
  abrirAccesibilidad,
}: {
  drawer: DrawerContentComponentProps;
  abrirAccesibilidad: () => void;
}) {
  const { nuevoChat } = useConversacion();
  const secciones: SeccionDeMenu[] = [
    {
      titulo: "Secciones",
      items: [
        { pantalla: "index", titulo: "Asistente", icono: "chat" },
        { pantalla: "accesos", titulo: "Accesos", icono: "external" },
        {
          titulo: "Accesibilidad",
          icono: "access",
          onPress: () => cerrarMenu(drawer, abrirAccesibilidad),
        },
      ],
    },
  ];

  return (
    <MenuLateral
      drawer={drawer}
      nombre="ChatAP"
      descripcion="Subsecretaría de Recursos Humanos"
      secciones={secciones}
      acciones={[
        {
          titulo: "Nuevo chat",
          icono: "plus",
          onPress: () =>
            cerrarMenu(drawer, () => {
              nuevoChat();
              drawer.navigation.navigate("index");
            }),
        },
      ]}
    >
      <PieCiudadano drawer={drawer} />
    </MenuLateral>
  );
}

/** Menú lateral de la app: un archivo de esta carpeta es una pantalla del menú. */
export default function LayoutCiudadano() {
  const C = useColors();
  const { width } = useWindowDimensions();
  const [accesibilidadAbierta, setAccesibilidadAbierta] = useState(false);

  return (
    <ChatProvider>
      <Drawer
        drawerContent={(drawer) => (
          <MenuCiudadano drawer={drawer} abrirAccesibilidad={() => setAccesibilidadAbierta(true)} />
        )}
        screenOptions={{ ...opcionesDelMenu(C, width), headerShown: false }}
      >
        <Drawer.Screen name="index" options={{ title: "ChatAP · Asistente virtual de trámites" }} />
        <Drawer.Screen name="descargas" options={{ title: "ChatAP · Descargas" }} />
        <Drawer.Screen name="accesos" options={{ title: "ChatAP · Accesos" }} />
      </Drawer>
      <VentanaAccesibilidad open={accesibilidadAbierta} onClose={() => setAccesibilidadAbierta(false)} />
    </ChatProvider>
  );
}
