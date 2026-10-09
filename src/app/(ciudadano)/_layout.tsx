import { Drawer } from "expo-router/drawer";
import { useWindowDimensions } from "react-native";

import { MenuLateral, type SeccionDeMenu } from "@/components/menu/MenuLateral";
import { PieCiudadano } from "@/components/menu/PieCiudadano";
import { Radius, Size, useColors } from "@/constants/theme";

const SECCIONES: SeccionDeMenu[] = [
  {
    titulo: "Secciones",
    items: [
      { pantalla: "index", titulo: "Asistente", icono: "chat" },
      { pantalla: "descargas", titulo: "Descargas", icono: "download" },
      { pantalla: "accesos", titulo: "Accesos", icono: "grid" },
    ],
  },
];

/** Menú lateral de la app: un archivo de esta carpeta es una pantalla del menú. */
export default function LayoutCiudadano() {
  const C = useColors();
  const { width } = useWindowDimensions();

  return (
    <Drawer
      drawerContent={(drawer) => (
        <MenuLateral
          drawer={drawer}
          nombre="ChatAP"
          descripcion="Subsec. de Recursos Humanos"
          secciones={SECCIONES}
        >
          <PieCiudadano drawer={drawer} />
        </MenuLateral>
      )}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        overlayColor: C.scrim,
        // 320 deja 70 px de velo en un teléfono de 390: espacio de sobra para cerrar.
        drawerStyle: {
          width: Math.min(Size.drawer, width - 56),
          backgroundColor: C.canvas,
          borderTopRightRadius: Radius["3xl"],
          borderBottomRightRadius: Radius["3xl"],
        },
        sceneStyle: { backgroundColor: C.canvas },
      }}
    >
      <Drawer.Screen name="index" options={{ title: "ChatAP · Asistente virtual de trámites" }} />
      <Drawer.Screen name="descargas" options={{ title: "ChatAP · Descargas" }} />
      <Drawer.Screen name="accesos" options={{ title: "ChatAP · Accesos" }} />
    </Drawer>
  );
}
