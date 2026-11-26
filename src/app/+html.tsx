import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Campos de texto en web: sin el contorno de foco del navegador, porque cada campo de la app
// (Input, SearchInput y el del chat) marca el foco con su propio borde y anillo. El del chat,
// además, sin barra de desplazamiento: el texto se sigue recorriendo con las flechas.
const estiloDeLosCampos = `
input, textarea { outline: none; }
#campo-del-chat { scrollbar-width: none; }
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
        <style dangerouslySetInnerHTML={{ __html: estiloDeLosCampos }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
