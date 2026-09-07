import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// solo el shell estático del build web: no corre en el cliente ni en nativo.
// title y description NO van acá: los pone el <Head> de cada ruta (react-helmet).
// Duplicarlos deja dos tags y Lighthouse lee el vacío/primero.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* el esquema arranca claro (ver theme.ts); sin esto el shell del navegador sigue al SO */}
        <meta name="color-scheme" content="light" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
