import { Redirect, useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { ActivityIndicator, StyleSheet, View, useWindowDimensions } from "react-native";

import { Encabezado } from "@/components/menu/Encabezado";
import { MenuLateral, type ItemDeMenu, type SeccionDeMenu } from "@/components/menu/MenuLateral";
import { PieAdmin } from "@/components/menu/PieAdmin";
import { Btn } from "@/components/ui/Btn";
import { PantallaAviso } from "@/components/ui/PantallaAviso";
import { Radius, Size, useColors } from "@/constants/theme";
import { AdminProvider, useAdmin, type Permission } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";

/** Una pantalla del panel: el archivo, su título y el permiso que pide. */
const PANTALLAS: {
  pantalla: string;
  titulo: string;
  icono: ItemDeMenu["icono"];
  permiso: Permission;
}[] = [
  { pantalla: "index", titulo: "Panel general", icono: "home", permiso: "dashboard" },
  { pantalla: "mesa-de-entrada", titulo: "Mesa de Entradas", icono: "box", permiso: "mesa_entrada" },
  { pantalla: "solicitudes", titulo: "Solicitudes", icono: "checkCircle", permiso: "solicitudes" },
  { pantalla: "usuarios", titulo: "Usuarios", icono: "users", permiso: "usuarios" },
  { pantalla: "conocimiento", titulo: "Conocimiento", icono: "bulb", permiso: "conocimiento" },
  { pantalla: "documentos", titulo: "Documentos", icono: "folder", permiso: "documentos" },
  { pantalla: "siged", titulo: "Integración SIGED", icono: "terminal", permiso: "siged" },
  { pantalla: "configuracion", titulo: "Configuración", icono: "settings", permiso: "configuracion" },
  { pantalla: "reportes", titulo: "Reportes", icono: "chart", permiso: "reportes" },
];

/** Grupos del menú, con los archivos que lleva cada uno. */
const GRUPOS = [
  { titulo: "Principal", pantallas: ["index", "mesa-de-entrada"] },
  { titulo: "Gestión", pantallas: ["solicitudes", "usuarios", "conocimiento", "documentos"] },
  { titulo: "Sistema", pantallas: ["siged", "configuracion", "reportes"] },
];

/**
 * Entrada al panel. Sin sesión lleva al login; con una cuenta que no es de
 * personal muestra el acceso restringido; con una de personal, abre el menú.
 */
export default function LayoutAdmin() {
  const C = useColors();
  const router = useRouter();
  const { user, isStaff, loading } = useAuth();

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
      </PantallaAviso>
    );
  }

  return (
    <AdminProvider>
      <MenuDelPanel />
    </AdminProvider>
  );
}

/** Drawer del panel. Una pantalla sin permiso no existe para el navegador. */
function MenuDelPanel() {
  const C = useColors();
  const { width } = useWindowDimensions();
  const { can } = useAdmin();

  const permitidas = PANTALLAS.filter((p) => can(p.permiso));

  const secciones: SeccionDeMenu[] = GRUPOS.map((grupo) => ({
    titulo: grupo.titulo,
    items: permitidas
      .filter((p) => grupo.pantallas.includes(p.pantalla))
      .map((p) => ({ pantalla: p.pantalla, titulo: p.titulo, icono: p.icono })),
  })).filter((seccion) => seccion.items.length > 0);

  return (
    <Drawer
      drawerContent={(drawer) => (
        <MenuLateral
          drawer={drawer}
          nombre="Acceso interno"
          descripcion="Subsec. de Recursos Humanos"
          secciones={secciones}
          lineaSobrePie
        >
          <PieAdmin drawer={drawer} />
        </MenuLateral>
      )}
      screenOptions={{
        header: () => <Encabezado />,
        drawerType: "front",
        overlayColor: C.scrim,
        drawerStyle: {
          width: Math.min(Size.drawer, width - 56),
          backgroundColor: C.canvas,
          borderTopRightRadius: Radius["3xl"],
          borderBottomRightRadius: Radius["3xl"],
        },
        sceneStyle: { backgroundColor: C.canvas },
      }}
    >
      {PANTALLAS.map((p) => (
        <Drawer.Protected key={p.pantalla} guard={can(p.permiso)}>
          <Drawer.Screen name={p.pantalla} options={{ title: `ChatAP · ${p.titulo}` }} />
        </Drawer.Protected>
      ))}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
