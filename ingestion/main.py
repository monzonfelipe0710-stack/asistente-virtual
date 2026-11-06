"""Arma el JSON normalizado del catálogo.

  python main.py                  XML + fichas del sitio (scraping), informe en data/informe_fichas.md
  python main.py --muestra 10     solo los 10 primeros trámites, en data/tramites_muestra.json
  python main.py --solo-xml       solo el XML, como antes del scraping
  python main.py --sin-verificar  sin los HEAD a los PDF de formularios y normas
  python main.py --municipal [--refrescar]
                                  trámites de la Municipalidad de la Ciudad de Formosa en
                                  data/tramites_municipal.json, informe en data/informe_municipal.md;
                                  el HTML y los PDF quedan en data/raw/municipal (--refrescar los
                                  vuelve a pedir)

Se corre con el entorno virtual de ingestion (ver el README del servidor, "Importar el catálogo").
"""

import argparse

from sources import xml_catalogo
import transform
import output

INPUT = "data/catalogo_tramites.xml"
OUTPUT = "data/tramites_normalizado.json"
OUTPUT_MUESTRA = "data/tramites_muestra.json"
CACHE = "data/cache_html"
INFORME = "data/informe_fichas.md"
RAW_MUNICIPAL = "data/raw/municipal"
OUTPUT_MUNICIPAL = "data/tramites_municipal.json"
INFORME_MUNICIPAL = "data/informe_municipal.md"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--muestra", type=int)
    p.add_argument("--solo-xml", action="store_true")
    p.add_argument("--sin-verificar", action="store_true")
    p.add_argument("--salida")
    p.add_argument("--municipal", action="store_true")
    p.add_argument("--refrescar", action="store_true")
    a = p.parse_args()

    if a.municipal:
        from sources import municipal
        import informe_municipal

        datos = municipal.read(RAW_MUNICIPAL, refrescar=a.refrescar, verificar=not a.sin_verificar, muestra=a.muestra)
        output.write_json(datos, a.salida or OUTPUT_MUNICIPAL)
        informe_municipal.escribir(datos, INFORME_MUNICIPAL, OUTPUT)
        return

    records = xml_catalogo.read(INPUT)
    if a.solo_xml:
        output.write_json(transform.normalize(records), a.salida or OUTPUT)
        return

    from sources import detalle_html
    import informe

    enriquecidos = detalle_html.read(records, cache_dir=CACHE, muestra=a.muestra, verificar=not a.sin_verificar)
    datos_informe = detalle_html.ultimo_informe
    data = transform.normalize(enriquecidos, datos_informe["organismos"])
    output.write_json(data, a.salida or (OUTPUT_MUESTRA if a.muestra else OUTPUT))
    informe.escribir(informe.armar(data, datos_informe, records), INFORME if not a.muestra else "data/informe_muestra.md")


if __name__ == "__main__":
    main()
