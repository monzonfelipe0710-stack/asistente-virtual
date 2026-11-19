import { useSyncExternalStore, type ReactNode } from "react";
import { Platform } from "react-native";
import { SafeAreaInsetsContext, type EdgeInsets } from "react-native-safe-area-context";

// En web, Expo Router fija las areas seguras en 0. Cuando la app se abre dentro del
// marco de iPhone para demos (?marco=iphone), se simulan la barra de estado (54 px)
// y el indicador de inicio (34 px) para que la app ocupe toda la pantalla del marco.
const INSETS_DEL_MARCO: EdgeInsets = { top: 54, bottom: 34, left: 0, right: 0 };

function abiertaEnMarcoDeIphone() {
  let marco = new URLSearchParams(window.location.search).get("marco");
  try {
    // Se guarda para que siga activo al navegar o recargar otra ruta dentro del marco.
    if (marco) {
      sessionStorage.setItem("marco", marco);
    } else {
      marco = sessionStorage.getItem("marco");
    }
  } catch {
    // Sin sessionStorage solo vale el parametro de la URL.
  }
  return marco === "iphone";
}

const sinSuscripcion = () => () => {};
const enElServidor = () => false;
let enMarcoEnElCliente: boolean | undefined;
const enElCliente = () => (enMarcoEnElCliente ??= Platform.OS === "web" && abiertaEnMarcoDeIphone());

export function AreasSegurasDelMarco({ children }: { children: ReactNode }) {
  // El HTML estatico se genera sin marco; en el cliente se lee la URL al hidratar.
  const enMarco = useSyncExternalStore(sinSuscripcion, enElCliente, enElServidor);

  if (!enMarco) {
    return children;
  }
  return <SafeAreaInsetsContext.Provider value={INSETS_DEL_MARCO}>{children}</SafeAreaInsetsContext.Provider>;
}
