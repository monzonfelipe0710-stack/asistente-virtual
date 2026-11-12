# Dry-run de la importación municipal

Base: la del .env (Neon). JSON consultado el 06/11/2026.

## Condiciones

- OK: 0 fichas no reconocidas (0 no reconocidas, 0 con error)
- OK: marcados por sanitización: 0, o hasta 3 y sin publicar (0 marcados)
- OK: entre 60 y 85 trámites a crear (69 a crear, 0 a actualizar, 0 sin cambios)
- OK: sectores a crear: la Municipalidad y sus 10 secretarías (11 a crear de 11 del JSON)
- OK: 0 conflictos con trámites provinciales (0 conflictos (0 con trámites existentes), 0 fallidos)
- OK: sin correos personales ni celulares en los textos (ninguno)
- OK: el texto del embedding del resto del catálogo no cambia por el organismo raíz (0 trámites con organismo raíz)

## Conteos antes

- tramites: 278
- publicados: 254
- municipales: 0
- publicadosSinEmbedding: 0
- sectores: 35
- mesas: 190
- catalogoVersion: 5482
- huella del resto del catálogo: 278 trámites, f5094dffbcc8bafb…

## Informe del importador (simulación)

```
SIMULACIÓN (--dry-run): no se escribió nada.
Sectores: 11 a crear, 0 a actualizar
Trámites: 69 creados, 0 actualizados, 0 sin cambios, 0 a despublicar por no figurar en el listado, 0 a reindexar, 0 fallidos, 0 conflictos, 0 para revisión
Mesas de entrada del portal: 8 a crear, 0 a actualizar, 0 editadas a mano (no se tocan)
Despublicación de faltantes: simulada (0)
```

## Sectores a crear

- Municipalidad de la Ciudad de Formosa
- Administración de Ingresos Municipales (AIM) (padre: Municipalidad de la Ciudad de Formosa)
- Dirección de Bromatología, Higiene y Comercialización (padre: Municipalidad de la Ciudad de Formosa)
- Secretaría de Obras Públicas (padre: Municipalidad de la Ciudad de Formosa)
- Dirección de Obras Privadas (padre: Secretaría de Obras Públicas)
- Dirección de Catastro y Tierras Fiscales (padre: Secretaría de Obras Públicas)
- Dirección de Planeamiento Urbano (padre: Secretaría de Obras Públicas)
- Dirección de Obras Públicas (padre: Secretaría de Obras Públicas)
- Tribunal de Administración de Faltas (padre: Municipalidad de la Ciudad de Formosa)
- Tránsito, Transporte y Emergencia (padre: Municipalidad de la Ciudad de Formosa)
- Habilitaciones Comerciales (padre: Municipalidad de la Ciudad de Formosa)
