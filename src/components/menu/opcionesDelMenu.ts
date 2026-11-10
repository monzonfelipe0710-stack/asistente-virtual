import type { DrawerNavigationOptions } from "expo-router/drawer";

import { Radius, Size, type Palette } from "@/constants/theme";

interface GestoConOffsets {
  activeOffsetX(offset: [number, number]): GestoConOffsets;
  failOffsetY(offset: [number, number]): GestoConOffsets;
}

export function opcionesDelMenu(C: Palette, width: number): DrawerNavigationOptions {
  return {
    drawerType: "front",
    overlayColor: C.scrim,
    // Por defecto solo se abre deslizando desde el borde (32 px); con todo el ancho, desde cualquier parte.
    swipeEdgeWidth: width,
    swipeMinDistance: 40,
    configureGestureHandler: (gesture) => {
      const gesto = gesture as unknown as GestoConOffsets;
      return gesto.activeOffsetX([-12, 12]).failOffsetY([-24, 24]) as unknown as typeof gesture;
    },
    // 320 deja 70 px de velo en un teléfono de 390: espacio de sobra para cerrar.
    drawerStyle: {
      width: Math.min(Size.drawer, width - 56),
      backgroundColor: C.canvas,
      borderTopRightRadius: Radius["3xl"],
      borderBottomRightRadius: Radius["3xl"],
    },
    sceneStyle: { backgroundColor: C.canvas },
  };
}
