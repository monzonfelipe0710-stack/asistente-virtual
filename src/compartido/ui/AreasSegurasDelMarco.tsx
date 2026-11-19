import { useSyncExternalStore, type ReactNode } from "react";
import { Platform } from "react-native";
import { SafeAreaInsetsContext, type EdgeInsets } from "react-native-safe-area-context";

// En web, Expo Router fija las areas seguras en 0. Cuando la app se abre dentro del
// marco de iPhone para demos, se simulan la barra de estado (54 px) y el indicador de
// inicio (34 px) para que la app ocupe toda la pantalla del marco.
const INSETS_DEL_MARCO: EdgeInsets = { top: 54, bottom: 34, left: 0, right: 0 };

// El marco abre la app en un iframe con name="marco-iphone". window.name se conserva
// en todas las navegaciones y recargas dentro de ese iframe, sin depender de la URL
// ni del almacenamiento del navegador. ?marco=iphone sirve para abrirla sin el marco.
function abiertaEnMarcoDeIphone() {
  return (
    window.name === "marco-iphone" ||
    new URLSearchParams(window.location.search).get("marco") === "iphone"
  );
}

const sinSuscripcion = () => () => {};
const enElServidor = () => false;
let enMarcoEnElCliente: boolean | undefined;
const enElCliente = () => (enMarcoEnElCliente ??= Platform.OS === "web" && abiertaEnMarcoDeIphone());

export function AreasSegurasDelMarco({ children }: { children: ReactNode }) {
  // El HTML estatico se genera sin marco; en el cliente se decide al hidratar.
  const enMarco = useSyncExternalStore(sinSuscripcion, enElCliente, enElServidor);

  if (!enMarco) {
    return children;
  }
  return <SafeAreaInsetsContext.Provider value={INSETS_DEL_MARCO}>{children}</SafeAreaInsetsContext.Provider>;
}
