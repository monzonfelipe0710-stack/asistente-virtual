# ChatAP — Asistente Virtual

Proyecto final de Práctica Profesional III. Asistente virtual para trámites de la Subsecretaría de Recursos Humanos de la Provincia de Formosa. Expo + React Native, corre en Android y iOS desde el mismo código.

## Desarrollo

```bash
npm install
npx expo start
```

Presioná `a` (Android), `i` (iOS) o `w` (web) en la terminal, o escaneá el QR con Expo Go.

## Estructura

El código está en `src` y se divide en tres carpetas.

- `app` tiene las rutas. Cada archivo de esa carpeta es una pantalla o un layout.
- `funcionalidades` tiene una carpeta por cada parte de la app. Cada carpeta guarda lo que solo usa esa parte.
- `compartido` tiene lo que usan dos o más partes.

```
src/
  app/
    _layout.tsx             Raíz: fuentes, sesión, avisos y la lista de pantallas
    +not-found.tsx          Pantalla para una dirección que no existe
    +html.tsx               HTML base de la versión web
    perfil.tsx              /perfil
    (ciudadano)/            Grupo con menú lateral, no aparece en la dirección
      _layout.tsx           Menú lateral: Asistente, Descargas y Accesos
      index.tsx             /            El chat
      descargas.tsx         /descargas
      accesos.tsx           /accesos
    (publico)/              Grupo sin layout propio
      login.tsx             /login
      recuperar.tsx         /recuperar
      restablecer.tsx       /restablecer
      cambiar-password.tsx  /cambiar-password
    admin/
      _layout.tsx           Control de entrada, menú del panel y permisos por pantalla
      index.tsx             /admin       Resumen
      solicitudes.tsx · mesa-de-entrada.tsx · tramites.tsx · usuarios.tsx
      documentos.tsx · calificaciones.tsx · reportes.tsx
  funcionalidades/
    chat/                   El chat: componentes, useChat, ChatContext, tipos y sugerencias
    menu/                   Menú lateral, encabezado, pies y diálogos del menú
    admin/                  Componentes, hooks y funciones del panel interno
    descargas/              Tarjeta de documento de /descargas
    accesos/                Lista de accesos de /accesos
  compartido/
    ui/                     Piezas de pantalla: Btn, Input, Select, Tabs, Modal, Toast y otras
    sesion/                 Sesión, permisos y validaciones de cuenta
    avatar/                 La mascota y el motor que la anima
    lib/                    Conexión con el servidor, almacenamiento, accesibilidad y vibración
    hooks/                  useKeyboardHeight
    utils/                  Fechas, tamaño de archivo e iniciales
    constantes/theme.ts     Colores, letras, espacios y radios
```

### Quién entra adónde

| Zona | Quién | Qué pasa si no corresponde |
| --- | --- | --- |
| `(ciudadano)` | Cualquiera | — |
| `login` | Sin sesión | Con sesión redirige: personal al panel, el resto al chat |
| `admin` | Personal (Superadmin o Administrador) | Sin sesión redirige a `/login`; con una cuenta de Ciudadano muestra "Acceso restringido" con la opción de cerrar sesión |
| Cada pantalla de `admin` | Según el permiso del rol | La pantalla no existe para quien no tiene permiso |

## Convenciones

- Solo van rutas en `src/app`. Un componente en esa carpeta se convertiría en una ruta, por ejemplo `Boton.tsx` pasaría a ser `/Boton`.
- Lo que usa una sola parte de la app va en su carpeta de `src/funcionalidades`. Lo que usan dos o más partes va en `src/compartido`.
- Cada archivo tiene un componente con export nombrado. Los archivos de `src/app` son la excepción y llevan `export default`, porque Expo Router lo exige.
- Los imports usan `@/`, por ejemplo `@/compartido/ui/Btn`. Dentro de la misma carpeta se usa `./`.
- El código no lleva comentarios.
- Los permisos se deciden en el layout y no en cada pantalla. `src/app/admin/_layout.tsx` decide qué pantallas existen para cada rol, con los permisos de `src/compartido/sesion/permisos.ts`.
- Las dependencias se instalan con `npx expo install` y no con `npm install`. Así la versión coincide con la de Expo Go.

## Diseño

Neutros sin tinte y un solo azul. Figtree en cuatro pesos (400, 500, 600 y 700) e IBM Plex Mono para números y fechas. Con la opción de letra más legible se usa Atkinson Hyperlegible Next. Base de 4 pt, margen lateral de 20. Los valores están en `src/compartido/constantes/theme.ts`; los componentes no escriben colores a mano.

## Verificación

```bash
npm run lint
npm run typecheck
```
