import { Drawer, type DrawerContentComponentProps } from "expo-router/drawer";
import { useState } from "react";
import { useWindowDimensions } from "react-native";

import { cerrarMenu, MenuLateral, type SeccionDeMenu } from "@/funcionalidades/menu/MenuLateral";
import { ListaDeChats } from "@/funcionalidades/menu/ListaDeChats";
import { opcionesDelMenu } from "@/funcionalidades/menu/opcionesDelMenu";
import { PieCiudadano } from "@/funcionalidades/menu/PieCiudadano";
import { VentanaAccesibilidad } from "@/funcionalidades/menu/VentanaAccesibilidad";
import { useColors } from "@/compartido/constantes/theme";
import { useAuth } from "@/compartido/sesion/AuthContext";
import { ChatProvider, useConversacion } from "@/funcionalidades/chat/ChatContext";

function MenuCiudadano({
  drawer,
  abrirAccesibilidad,
}: {
  drawer: DrawerContentComponentProps;
  abrirAccesibilidad: () => void;
}) {
  const { nuevoChat } = useConversacion();
  const { user } = useAuth();
  const secciones: SeccionDeMenu[] = [
    {
      items: [
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
      contenidoDesplazable={user ? <ListaDeChats drawer={drawer} /> : undefined}
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
