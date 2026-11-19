"""Informe del recorrido de las fichas: lo que se leyó, lo que no y lo que no coincide con el XML."""

from collections import Counter
from pathlib import Path

from sources.detalle_html import id_de_url
from transform import clave_nombre


def motivo_fuera(t):
    if t.get("errorFicha"):
        return f"no figura en el listado y la ficha no se pudo leer ({t['errorFicha']})"
    if not t.get("organismoIndexado"):
        return "su organismo no figura en el listado de organismos del sitio"
    if t.get("detalle"):
        return "no figura en el listado del sitio pero la ficha sigue completa (¿dado de baja?)"
    return "no figura en el listado del sitio"


def armar(datos, informe, records):
    xml_total = len(records)
    tramites = datos["tramites"]
    orgs = informe["organismos"]
    sectores = {clave_nombre(s["nombre"]): s["nombre"] for s in datos["sectores"]}
    coincidentes = [o for o in orgs if clave_nombre(o["nombre"]) in sectores]
    sitio_sin_sector = [o for o in orgs if clave_nombre(o["nombre"]) not in sectores]
    sin_indexar = sorted({t["sector"] for t in tramites if not t.get("organismoIndexado")})
    del_xml_sin_indexar = [t for t in tramites if not t.get("organismoIndexado")]
    fuera = [t for t in tramites if not t.get("enListado")]
    ids_xml = {id_de_url(r["url"]) for r in records}
    en_sitio_no_xml = [i for i in informe["idsDelListado"] if i not in ids_xml]
    enlaces = informe["enlaces"]
    rotos = {u: e for u, e in enlaces.items() if e["estado"] != "ok"}
    usos = Counter()
    for t in tramites:
        for d in (t.get("detalle") or {}).get("formularios", []) + (t.get("detalle") or {}).get("normas", []):
            if d.get("url") in rotos:
                usos[d["url"]] += 1

    l = [
        "# Informe del recorrido de las fichas de formosa.gob.ar",
        "",
        f"Capturado el {informe['capturadoEn']}. Pedidos al sitio: {informe['pedidos']} (y {informe['desdeCache']} páginas leídas de la caché local).",
        "",
        "## Totales",
        "",
        f"- Trámites en el XML: {xml_total} ({len(tramites)} después de deduplicar)",
        f"- Trámites en el listado del sitio: {len(informe['idsDelListado'])}",
        f"- Del XML que no figuran en el listado: {len(fuera)}",
        f"- Del listado que no están en el XML: {len(en_sitio_no_xml)}{' (' + ', '.join(map(str, en_sitio_no_xml)) + ')' if en_sitio_no_xml else ''}",
        f"- Fichas leídas: {informe['fichasLeidas']} de {informe['fichas']}; con error: {len(informe['errores'])}",
        f"- Organismos del sitio: {len(orgs)}; coinciden con nuestros sectores: {len(coincidentes)}",
        f"- Sectores del XML que el sitio no indexa: {len(sin_indexar)}, con {len(del_xml_sin_indexar)} trámites",
        f"- Enlaces de formularios y normas verificados: {len(enlaces)}; rotos: {len(rotos)}",
        "",
        "## Organismos del sitio (organismo → ministerio)",
        "",
        "Propuesta de jerarquía para Sector.parentId. No se aplica: el JSON no lleva `padre`.",
        "",
        "| Organismo | Ministerio | Trámites | Páginas del listado |",
        "|---|---|---|---|",
        *[f"| {o['nombre']} | {o['ministerio'] or '-'} | {len(o['tramites'])} | {o['paginas']} |" for o in orgs],
        "",
    ]
    if sitio_sin_sector:
        l += ["Organismos del sitio sin sector con el mismo nombre:", "", *[f"- {o['nombre']}" for o in sitio_sin_sector], ""]
    l += [
        "## Sectores que el sitio no indexa (quedan como están)",
        "",
        *[f"- {s}: {sum(1 for t in del_xml_sin_indexar if t['sector'] == s)} trámites" for s in sin_indexar],
        "",
        "## Trámites del XML que no figuran en el listado",
        "",
        "| Trámite | Sector | URL | Motivo |",
        "|---|---|---|---|",
        *[f"| {t['nombre']} | {t['sector']} | {t['fuenteUrl']} | {motivo_fuera(t)} |" for t in fuera],
        "",
        "## Fichas con error",
        "",
        *([f"- {e['titulo']} <{e['url']}>: {e['motivo']}" for e in informe["errores"]] or ["Ninguna."]),
        "",
        "## Enlaces rotos",
        "",
        *([f"- {u} (HTTP {e.get('http')}, en {usos[u]} trámites)" for u, e in sorted(rotos.items())] or ["Ninguno."]),
        "",
    ]
    return "\n".join(l)


def escribir(texto, ruta):
    Path(ruta).write_text(texto, encoding="utf-8")
    print(f"Informe en {ruta}")
