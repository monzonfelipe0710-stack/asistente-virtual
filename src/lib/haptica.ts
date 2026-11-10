import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { leerAjustes } from "@/lib/accesibilidad";

function permitido() {
  return Platform.OS !== "web" && leerAjustes().vibracion;
}

export function vibrarAlMantener() {
  if (permitido()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function vibrarAlElegir() {
  if (permitido()) Haptics.selectionAsync().catch(() => {});
}

export function vibrarAlConfirmar() {
  if (permitido()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function vibrarAlAdvertir() {
  if (permitido()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function vibrarSuave() {
  if (permitido()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
