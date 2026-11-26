import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Campo del chat en web: sin el contorno de foco del navegador (la barra del chat ya marca el foco
// con su borde) y sin barra de desplazamiento; el texto se sigue recorriendo con las flechas.
const estiloDelCampoDelChat = `
#campo-del-chat { outline: none; scrollbar-width: none; }
#campo-del-chat::-webkit-scrollbar { display: none; }
`;

export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
  return (
    <html lang="es" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="color-scheme" content="light" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: estiloDelCampoDelChat }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
