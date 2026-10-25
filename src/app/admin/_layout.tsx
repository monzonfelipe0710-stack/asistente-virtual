import { Redirect, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from "react-native";

import { DialogoCerrarSesion } from "@/components/menu/DialogoCerrarSesion";
import { Encabezado } from "@/components/menu/Encabezado";
import {
  cerrarMenu,
  MenuLateral,
  type ItemDeMenu,
  type SeccionDeMenu,
} from "@/components/menu/MenuLateral";
import { opcionesDelMenu } from "@/components/menu/opcionesDelMenu";
import { PieAdmin } from "@/components/menu/PieAdmin";
import { VentanaAccesibilidad } from "@/components/menu/VentanaAccesibilidad";
import { Btn } from "@/components/ui/Btn";
import { PantallaAviso } from "@/components/ui/PantallaAviso";
import { useColors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import type { Permission } from "@/lib/permisos";

/** Una pantalla del panel: el archivo, su título, su grupo del menú y el permiso que pide. */
const PANTALLAS: {
  pantalla: string;
  titulo: string;
  icono: ItemDeMenu["icono"];
  grupo: string;
  permiso: Permission;
}[] = [
  { pantalla: "index", titulo: "Panel general", icono: "home", grupo: "Principal", permiso: "dashboard" },
  { pantalla: "mesa-de-entrada", titulo: "Mesa de Entradas", icono: "box", grupo: "Principal", permiso: "mesa_entrada" },
  { pantalla: "solicitudes", titulo: "Solicitudes", icono: "checkCircle", grupo: "Gestión", permiso: "solicitudes" },
  { pantalla: "usuarios", titulo: "Usuarios", icono: "users", grupo: "Gestión", permiso: "usuarios" },
  { pantalla: "conocimiento", titulo: "Conocimiento", icono: "bulb", grupo: "Gestión", permiso: "conocimiento" },
  { pantalla: "documentos", titulo: "Documentos", icono: "folder", grupo: "Gestión", permiso: "documentos" },
  { pantalla: "siged", titulo: "Integración SIGED", icono: "terminal", grupo: "Sistema", permiso: "siged" },
  { pantalla: "configuracion", titulo: "Configuración", icono: "settings", grupo: "Sistema", permiso: "configuracion" },
  { pantalla: "reportes", titulo: "Reportes", icono: "chart", grupo: "Sistema", permiso: "reportes" },
];

/**
 * Entrada al panel. Sin sesión lleva al login; con una cuenta que no es de
 * personal muestra el acceso restringido; con una de personal, abre el menú.
 * Una pantalla sin permiso no existe para el navegador.
 */
export default function LayoutAdmin() {
  const C = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, isStaff, loading, logout } = useAuth();
  const { can } = usePermisos();
  const [accesibilidadAbierta, setAccesibilidadAbierta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  // La sesión se lee de forma asíncrona: sin esto, en el primer cuadro se vería
  // el login incluso teniendo una sesión válida.
  if (loading) {
    return (
      <View style={[styles.cargando, { backgroundColor: C.canvas }]}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  if (!isStaff) {
    return (
      <PantallaAviso
        icono="lock"
        titulo="Acceso restringido"
        texto="Tu cuenta de Ciudadano no tiene permiso para entrar al Acceso Interno."
      >
        <Btn label="Volver al asistente" variant="secondary" onPress={() => router.replace("/")} />
        <Btn label="Cerrar sesión" variant="ghost" onPress={() => setConfirmando(true)} />
        <DialogoCerrarSesion
          open={confirmando}
          onClose={() => setConfirmando(false)}
          onConfirmar={logout}
        />
      </PantallaAviso>
    );
  }

  const permitidas = PANTALLAS.filter((p) => can(p.permiso));

  const grupos = [...new Set(permitidas.map((p) => p.grupo))];

  const secciones: SeccionDeMenu[] = grupos.map((grupo) => ({
    titulo: grupo,
    items: permitidas
      .filter((p) => p.grupo === grupo)
      .map((p) => ({ pantalla: p.pantalla, titulo: p.titulo, icono: p.icono })),
  }));

  return (
    <>
      <Drawer
        drawerContent={(drawer) => (
          <MenuLateral
            drawer={drawer}
            nombre="Acceso interno"
            descripcion="Subsecretaría de Recursos Humanos"
            secciones={[
              ...secciones,
              {
                titulo: "Preferencias",
                items: [
                  {
                    titulo: "Accesibilidad",
                    icono: "access",
                    onPress: () => cerrarMenu(drawer, () => setAccesibilidadAbierta(true)),
                  },
                ],
              },
            ]}
            lineaSobrePie
          >
            <PieAdmin drawer={drawer} />
          </MenuLateral>
        )}
        screenOptions={{ ...opcionesDelMenu(C, width), header: () => <Encabezado /> }}
      >
        {PANTALLAS.map((p) => (
          <Drawer.Protected key={p.pantalla} guard={can(p.permiso)}>
            <Drawer.Screen name={p.pantalla} options={{ title: `ChatAP · ${p.titulo}` }} />
          </Drawer.Protected>
        ))}
      </Drawer>
      <VentanaAccesibilidad open={accesibilidadAbierta} onClose={() => setAccesibilidadAbierta(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
