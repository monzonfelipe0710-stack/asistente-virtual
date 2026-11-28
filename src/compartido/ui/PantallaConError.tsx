import { usePathname, useRouter, type ErrorBoundaryProps } from "expo-router";
import { useEffect } from "react";

import { Btn } from "./Btn";
import { PantallaAviso } from "./PantallaAviso";

// Aislamiento de fallas por pantalla: cada ruta reexporta este ErrorBoundary
// (`export { ErrorBoundary } from "@/compartido/ui/PantallaConError"`). Si una pantalla
// se rompe al renderizar, expo-router muestra esto solo en su lugar; el menú y las demás
// pantallas siguen andando.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();
  const ruta = usePathname();
  const inicio = ruta.startsWith("/admin") ? "/admin" : "/";

  useEffect(() => {
    console.error(`Falló la pantalla ${ruta}:`, error);
  }, [error, ruta]);

  return (
    <PantallaAviso
      icono="alert"
      titulo="Algo falló en esta pantalla"
      texto="El resto de la app sigue funcionando. Probá de nuevo o volvé al inicio."
    >
      <Btn label="Reintentar" onPress={() => void retry()} />
      {ruta !== inicio && (
        <Btn label="Volver al inicio" variant="secondary" onPress={() => router.replace(inicio)} />
      )}
    </PantallaAviso>
  );
}
