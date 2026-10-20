# Revisión: el chat marca `encontrado: true` aunque no encontró nada útil

Hallazgo del 15 de octubre de 2026, al probar el chat con los datos de `npm run seed:demo`.
Todavía no se cambió nada en el código.

## Resumen

`encontrado` indica si la **búsqueda** trajo algún trámite, no si el **modelo** pudo
responder con ellos. Como el filtro de la búsqueda es muy permisivo, casi cualquier
pregunta trae trámites, incluso "hola". El resultado:

- El ciudadano recibe "no encontré información", pero la API responde `encontrado: true`.
- La consulta se cuenta como respondida en las métricas y se le atribuye a un trámite
  que no tiene nada que ver.
- Nunca aparece en `GET /api/metricas/sin-respuesta`, que es justamente la lista que
  sirve para saber qué trámites faltan cargar.

## Cómo se reproduce

Con los datos de prueba cargados, `POST /api/chat` con:

```json
{ "pregunta": "¿Cómo pido días para rendir un examen de la facultad?" }
```

El trámite que responde a esa pregunta ("Licencia por examen") está como borrador, así
que el chat no debería encontrarlo. Respuesta real:

```json
{
  "respuesta": "No encontré información sobre esa consulta. Te sugiero reformular tu pregunta...",
  "tramitesEncontrados": [
    { "nombre": "Licencia por enfermedad de corto tratamiento" },
    { "nombre": "Certificado de servicios" },
    { "nombre": "Licencia anual ordinaria" },
    { "nombre": "Constancia de trabajo" },
    { "nombre": "Bonificación por título" }
  ],
  "encontrado": true
}
```

El modelo hizo lo correcto: ninguno de esos trámites sirve y lo dijo. Pero en `consultas`
quedó registrada como respondida y atribuida a "Licencia por enfermedad de corto
tratamiento".

## Por qué pasa

### 1. El umbral de distancia es muy alto

[`busqueda.service.js:23`](../src/services/busqueda.service.js#L23) deja pasar cualquier
trámite con distancia coseno menor a `0.8`. Con `text-embedding-3-small`, una pregunta
sin ninguna relación con los trámites queda entre `0.75` y `0.8`, o sea que pasa.

### 2. `encontrado` sale solo de la cantidad de resultados

[`chat.service.js:76`](../src/services/chat.service.js#L76) decide con
`tramites.length === 0`. Si hubo al menos un resultado, las líneas
[103-110](../src/services/chat.service.js#L103-L110) registran `encontrado: true` y
atribuyen la consulta a `tramites[0]`, sin importar lo que haya contestado el modelo.

### 3. Hallazgo secundario: el filtro de texto completo casi nunca coincide

La condición `search_vector @@ plainto_tsquery('spanish', pregunta)`
([línea 24](../src/services/busqueda.service.js#L24)) exige que **todas** las palabras de
la pregunta estén en el trámite, porque `plainto_tsquery` une los términos con AND. Con
una pregunta en lenguaje natural ("qué necesito para pedir...") eso no pasa nunca. En
todas las mediciones de abajo dio `false`, incluso cuando el trámite era el correcto.

En la práctica, el filtro depende solo de la distancia vectorial. El texto completo
sigue sumando al puntaje (`ts_rank` no exige que coincidan todos los términos), pero
nunca hace entrar a un trámite que no haya pasado por distancia.

## Mediciones

Distancia coseno de los trámites más cercanos para cada pregunta, con los 15 trámites
de prueba. "Pasan" es cuántos trámites publicados superan el filtro actual.

| Pregunta | Pasan | Más cercano (distancia) | Segundo | ¿Debería encontrar algo? |
|---|---|---|---|---|
| ¿Qué necesito para pedir la licencia por maternidad? | 13 | Licencia por maternidad (0.261) | Licencia por paternidad (0.298) | Sí |
| ¿Cómo pido días para rendir un examen de la facultad? | 13 | Licencia por examen, borrador (0.412) | Enfermedad de corto tratamiento (0.598) | No, el trámite no está publicado |
| hola | 9 | Asignación familiar por hijo (0.760) | Licencia por matrimonio (0.772) | No |
| Receta de chipá | 3 | Duplicado de recibo de sueldo (0.772) | Licencia por maternidad (0.781) | No |
| ¿Cuál es la capital de Francia? | 0 | Asignación familiar por hijo (0.907) | Constancia de trabajo (0.913) | No |

Lo que muestran:

- Los trámites que de verdad responden la pregunta quedan por debajo de `0.45`.
- Las preguntas sin relación quedan entre `0.75` y `0.8`, y el filtro actual las deja pasar.
- Con un umbral cercano a `0.5`, "hola", "Receta de chipá" y la del examen no traerían
  ningún resultado. Se registrarían como sin respuesta y no se llamaría al modelo.

> Son 5 preguntas sobre 15 trámites. Alcanza para ver el problema, no para fijar un
> umbral definitivo. Antes de elegir un valor conviene medir con más preguntas reales,
> por ejemplo las que ya están en `consultas`.

Consulta para medir una pregunta (reemplazar `:vector` por el embedding de la pregunta):

```sql
SELECT nombre, publicado,
  round((embedding <=> :vector::vector)::numeric, 3) AS distancia
FROM tramites
WHERE embedding IS NOT NULL
ORDER BY distancia
LIMIT 6;
```

## Impacto

| Dónde | Qué pasa hoy |
|---|---|
| `GET /api/metricas/sin-respuesta` | Casi nunca recibe consultas. Las preguntas sin trámite cargado no aparecen y se pierde la señal de qué falta cargar |
| `GET /api/metricas/por-tramite` | Suma consultas a trámites que no tuvieron nada que ver, con preferencia por los que tienen el embedding más "genérico" |
| Respuesta de `/api/chat` | `tramitesEncontrados` lista trámites que el modelo descartó. El cliente de prueba los muestra como "Trámites usados para responder", lo que confunde |
| Costo | Saludos y preguntas fuera de tema igual pagan una llamada a `gpt-4o-mini` con 5 trámites completos como contexto |

## Opciones para corregirlo

### A. Bajar el umbral de distancia

Cambiar `0.8` por un valor medido (con estos datos, alrededor de `0.5`) en
`busqueda.service.js`. Conviene sacarlo a una constante o a una variable de entorno
para poder ajustarlo sin tocar la consulta.

- **A favor:** un cambio de una línea. Las preguntas fuera de tema ni siquiera llegan
  al modelo, así que también baja el costo.
- **En contra:** el umbral depende del modelo de embeddings y de cómo estén redactados
  los trámites, así que hay que recalibrarlo si cambia cualquiera de los dos. Una
  pregunta válida pero mal redactada puede quedar afuera.

### B. Que el modelo diga si encontró la respuesta

Pedirle a `gpt-4o-mini` una salida estructurada (`response_format` con `json_schema`)
en lugar de texto libre, por ejemplo:

```json
{
  "respuesta": "texto para el ciudadano",
  "encontrado": true,
  "tramitesUsados": [12, 15]
}
```

Y usar esos campos para `encontrado`, para `tramitesEncontrados` y para atribuir la
consulta en `registrarConsulta`.

- **A favor:** `encontrado` y la atribución reflejan lo que realmente se respondió. Las
  métricas pasan a ser confiables.
- **En contra:** requiere incluir el `id` de cada trámite en el contexto (hoy
  `formatearTramite` solo pone "Trámite 1", "Trámite 2"...) y cambiar el registro de
  la consulta. No ahorra llamadas al modelo.

### C. Las dos

Umbral más bajo para cortar lo que es claramente fuera de tema antes de llamar al
modelo, y salida estructurada para decidir `encontrado` en los casos dudosos.

### Aparte: el filtro de texto completo

Para que el texto completo pueda hacer entrar trámites por sí mismo, la condición podría
usar OR entre términos en lugar de AND (por ejemplo, construyendo la `tsquery` con `|`
a partir de `plainto_tsquery`), o directamente quitarla del `WHERE` y dejar `ts_rank`
solo en el puntaje. Es independiente de lo anterior, pero conviene revisarlo junto con
el umbral, porque cambia qué trámites llegan a pasar el filtro.

## Recomendación

Empezar por **C**. La opción A sola corrige los casos claros ("hola", preguntas fuera de
tema), pero no los dudosos como el del examen, donde hay trámites parecidos cerca. La
opción B sola corrige las métricas, pero sigue gastando una llamada al modelo por cada
saludo.

## Cómo verificar el arreglo

Con `npm run seed:demo` cargado, las cinco preguntas de la tabla deberían dar:

| Pregunta | `encontrado` esperado | Registrada en |
|---|---|---|
| Licencia por maternidad | `true` | por-tramite, atribuida a "Licencia por maternidad" |
| Examen de la facultad | `false` | sin-respuesta |
| hola | `false` | sin-respuesta |
| Receta de chipá | `false` | sin-respuesta |
| Capital de Francia | `false` | sin-respuesta (ya funciona así hoy) |
