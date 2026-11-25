"""Informe del recorrido de formosatuciudad.gob.ar y comparación de nombres con el catálogo provincial."""

import json
import re
from pathlib import Path

from sources.municipal import ADVERTENCIA, CATEGORIAS, clave, numero_ar

FORMATOS = {
    "secciones": "rótulos div.texto.tema (Descripción, Dónde se realiza, Requisitos, Documentación a presentar, Valor del trámite) o preguntas numeradas (1 ¿En qué consiste...? a 6 ¿Qué otro dato...?)",
    "tabla": "\"REQUISITOS:\" y una tabla con un requisito por fila, formularios PDF enlazados y la norma (ord. 7708/22)",
    "descarga": "solo el recuadro \"DESCARGAR EL FORMULARIO\" (a veces con una línea de aclaración)",
    "libre": "subtítulos p.bajada, listas numeradas y párrafos sin rótulos (Tránsito, Habilitaciones, Bromatología, Juzgados)",
}
VACIAS = {"de", "del", "la", "las", "los", "el", "y", "e", "o", "a", "en", "por", "para", "con", "sobre", "que", "tramite", "tramites", "requisitos", "solicitud", "obtener", "presentar", "documentacion", "certificado", "certificacion"}
TEMAS = [
    ("habilitaciones comerciales", r"\bhabilitaci"),
    ("libre deuda, tasas y exenciones", r"\blibre deuda|\btasa|\bexenci|\bcontribuci"),
    ("impuesto inmobiliario (urbano municipal, rural provincial)", r"\binmobiliario"),
    ("automotores y titularidad", r"\bautomotor|\brodados?\b|\btitularidad|\bradicaci"),
    ("licencias (de conducir municipal; médicas o de pesca provinciales)", r"\blicencias?\b"),
    ("catastro, dominio y mensura", r"\bcatastr|\bdominio\b|\bmensuras?\b"),
    ("obras y planos", r"\bobras?\b(?!\s+social)|\bconstrucci|\bplanos?\b"),
    ("cementerio", r"\bcementerio|\binhumaci"),
    ("faltas, infracciones y tránsito", r"\bfaltas?\b|\binfracci|\btr[aá]nsito|\bestacionamiento"),
    ("carnet de sanidad y bromatología", r"\bsanidad|\bbromatolog"),
]


def raiz(palabra):
    return re.sub(r"(?:es|s)$", "", palabra) if len(palabra) > 4 else palabra


def palabras(nombre):
    return {raiz(p) for p in clave(nombre).split() if p not in VACIAS and len(p) > 2}


def pares_parecidos(municipales, provinciales, umbral=0.4):
    salida = []
    for m in municipales:
        pm = palabras(m)
        for p in provinciales:
            if clave(m) == clave(p):
                salida.append((m, p, "idéntico", 1.0))
                continue
            pp = palabras(p)
            comunes = pm & pp
            if not comunes:
                continue
            j = len(comunes) / len(pm | pp)
            if j >= umbral or (len(comunes) >= 2 and j >= 0.2):
                salida.append((m, p, "muy parecido", j))
    return sorted(salida, key=lambda x: (-x[3], x[0]))


def temas(municipales, provinciales):
    filas = []
    for tema, patron in TEMAS:
        mu = [n for n in municipales if re.search(patron, n, re.I)]
        pr = [n for n in provinciales if re.search(patron, n, re.I)]
        if mu:
            filas.append((tema, mu, pr))
    return filas


def sin_contrastar(tramites):
    salida = []
    for t in tramites:
        d = t["detalle"]
        for c in d["costos"]:
            if ADVERTENCIA in (c.get("importe") or ""):
                salida.append((t["nombre"], f"{c['concepto']}: {c['importe'].replace(f' ({ADVERTENCIA})', '').replace(ADVERTENCIA, '').strip()}".rstrip(": ")))
        for linea in (d.get("requisitos") or "").split("\n"):
            if ADVERTENCIA in linea:
                salida.append((t["nombre"], f"(requisito) {linea.replace(f' ({ADVERTENCIA})', '')}"))
    return salida


def armar(datos, provincial=None):
    t = datos["tramites"]
    inf = datos["informe"]
    mod = datos["modulo"]
    l = [
        "# Informe del recorrido de formosatuciudad.gob.ar",
        "",
        f"Consultado el {datos['consultadoEl']} ({datos['capturadoEn']}). Pedidos al sitio: {inf['pedidos']}; leídos de la caché local: {inf['desdeCache']}.",
        "",
        "## Totales",
        "",
        f"- Fichas del listado: {len(t) + len(datos['noReconocidas']) + len(datos['errores'])}; leídas: {len(t)}; no reconocidas: {len(datos['noReconocidas'])}; con error: {len(datos['errores'])}",
        f"- Enlaces del listado que no son fichas: {len(datos['noFichas'])}",
        f"- Sectores: {len(datos['sectores'])} (la Municipalidad y {len(datos['sectores']) - 1} debajo)",
        "",
        "## Formatos de ficha",
        "",
        "| Formato | Fichas | Qué trae |",
        "|---|---|---|",
        *[f"| {f} | {len(inf['formatos'].get(f, []))} | {d} |" for f, d in FORMATOS.items()],
        "",
        "## Fichas no reconocidas",
        "",
        *([f"- {x['titulo']} <{x['url']}>: {x['motivo']}" for x in datos["noReconocidas"]] or ["Ninguna."]),
        "",
        "## Fichas con error",
        "",
        *([f"- {x['titulo']} <{x['url']}>: {x['motivo']}" for x in datos["errores"]] or ["Ninguna."]),
        "",
        "## Enlaces del listado que no son fichas (no se importan)",
        "",
        *([f"- {x['texto']} <{x['url']}>: {x['motivo']}" for x in datos["noFichas"]] or ["Ninguno."]),
        "",
        "## Sectores",
        "",
        *[f"- {s['nombre']}{' (padre: ' + s['padre'] + ')' if s.get('padre') else ' (MUNICIPAL, Formosa)'}" for s in datos["sectores"]],
        "",
        "## Valor del módulo",
        "",
    ]
    if mod.get("legible"):
        i = mod["vigente"]["indice"]
        l += [
            f"Fuente: {mod.get('titulo', '')} <{mod['fuente']}>. Fechas de la tabla: {', '.join(mod['desde'])}; vigente a la consulta: desde el {mod['vigente']['desde']}.",
            "",
            "| Tributo | Valor vigente |",
            "|---|---|",
            *[f"| {k} | ${numero_ar(mod['categorias'][k][i])} |" for k, _ in CATEGORIAS if k in mod["categorias"]],
            "",
        ]
        if mod.get("motivo"):
            l += [f"Aviso: {mod['motivo']}.", ""]
    else:
        l += [f"No se pudo leer con certeza: {mod.get('motivo')}. Los costos en módulos quedan solo con la cantidad.", ""]
    l += [
        "Los montos en pesos calculados caducan cuando la AIM publica un valor nuevo del módulo: hay que volver a correr el scraper y el importador.",
        "",
        "## Costos en módulos sin monto en pesos",
        "",
        *([f"- {x['tramite']}: {x['concepto']}, {x['modulos']} módulos ({x['motivo']})" for x in inf["modulos"]] or ["Ninguno."]),
        "",
        "## Montos viejos del sitio (pesos o unidades tributarias descartados al calcular con el módulo vigente)",
        "",
        *([f"- {x['tramite']}: «{x['texto'].replace(chr(10), ' ')}»" + (f" → {x['reemplazo']}" if x.get("reemplazo") else "") for x in inf["pesosViejos"]] or ["Ninguno."]),
        "",
        "## Montos publicados que no se pueden contrastar con el módulo (quedan con la advertencia)",
        "",
        *([f"- {n}: {linea}" for n, linea in sin_contrastar(t)] or ["Ninguno."]),
        "",
        "## Datos personales descartados",
        "",
        *([f"- {x['tipo']}: {x['valor']} <{x['url']}>" for x in inf["descartes"]] or ["Ninguno."]),
        "",
    ]
    rotos = {u: e for u, e in inf.get("enlaces", {}).items() if e.get("estado") != "ok"}
    l += ["## Adjuntos con el enlace roto (no se importan)", "", *([f"- {u} (HTTP {e.get('http')})" for u, e in sorted(rotos.items())] or ["Ninguno."]), ""]
    if provincial:
        municipales = [x["nombre"] for x in t]
        provinciales = sorted({x["nombre"] for x in provincial["tramites"]})
        pares = pares_parecidos(municipales, provinciales)
        l += [
            "## Nombres iguales o muy parecidos entre el catálogo municipal y el provincial",
            "",
            "| Municipal | Provincial | Relación |",
            "|---|---|---|",
            *([f"| {m} | {p} | {r} ({j:.2f}) |" for m, p, r, j in pares] or ["| - | - | ninguno |"]),
            "",
            "## Temas donde un ciudadano podría confundir la jurisdicción",
            "",
            *[f"- {tema}: {len(mu)} municipales (p. ej. {'; '.join(mu[:2])}) y " + (f"{len(pr)} provinciales (p. ej. {'; '.join(pr[:3])})" if pr else "ninguno provincial cargado (el ciudadano igual puede creer que es provincial)") for tema, mu, pr in temas(municipales, provinciales)],
            "",
        ]
    return "\n".join(l)


def escribir(datos, ruta, ruta_provincial=None):
    provincial = None
    if ruta_provincial and Path(ruta_provincial).exists():
        provincial = json.loads(Path(ruta_provincial).read_text(encoding="utf-8"))
    Path(ruta).write_text(armar(datos, provincial), encoding="utf-8")
    print(f"Informe en {ruta}")
