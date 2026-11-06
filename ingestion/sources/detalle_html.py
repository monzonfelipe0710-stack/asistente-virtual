"""Scraping de las fichas de la Guía de Trámites de formosa.gob.ar.

Expone read(records, ...) con la misma forma que xml_catalogo.read: recibe los registros del XML y
devuelve los mismos registros, cada uno con una clave "detalle" (o None si no se pudo leer la ficha),
y además arma un informe del recorrido (`ultimo_informe`).

Cortesía con el sitio: un pedido por segundo como mucho (GET y HEAD, a cualquier host), un
User-Agent que identifica el proyecto y robots.txt respetado. El HTML crudo queda en una caché
local: una corrida cortada se retoma sin volver a pedir lo que ya se bajó.

Lo que se descarta a propósito: la fila "Responsable:" de cada oficina (nombres de personas).
"""

import json
import re
import time
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

BASE = "https://www.formosa.gob.ar"
USER_AGENT = "ChatAP/0.1 (asistente virtual de tramites de Formosa; proyecto de estudiantes del IPF)"
INTERVALO = 1.0  # segundos entre pedidos
REINTENTOS = 3

# ---------------------------------------------------------------------------------------------
# Texto


def decodificar(contenido):
    """El sitio declara ISO-8859-1, pero algunas fichas traen comillas y guiones de Windows-1252
    (0x80-0x9f), que en ISO-8859-1 son controles y la sanitización borraría."""
    texto = contenido.decode("iso-8859-1")
    if not re.search("[\x80-\x9f]", texto):
        return texto
    return "".join(
        bytes([ord(c)]).decode("cp1252", errors="ignore") or c if "\x80" <= c <= "\x9f" else c
        for c in texto
    )


def _limpio(texto):
    return re.sub(r"[ \t\r\f\v\xa0]+", " ", texto or "").strip()


def texto_multilinea(nodo):
    """Texto de un nodo conservando los saltos de <br> y de párrafo, sin líneas vacías repetidas."""
    if nodo is None:
        return ""
    copia = BeautifulSoup(str(nodo), "html.parser")
    for br in copia.find_all("br"):
        br.replace_with("\n")
    for p in copia.find_all(["p", "li", "tr", "div"]):
        p.insert_before("\n")
        p.insert_after("\n")
    lineas = [_limpio(l) for l in copia.get_text().split("\n")]
    salida, vacia = [], False
    for l in lineas:
        if l:
            salida.append(l)
            vacia = False
        elif salida and not vacia:
            salida.append("")
            vacia = True
    return "\n".join(salida).strip()


# ---------------------------------------------------------------------------------------------
# Parseo (funciones puras: reciben HTML ya decodificado)

ERRORES = ("trámite no encontrado", "ha ocurrido un error", "la página a la que intenta acceder no se encuentra")


def es_pagina_de_error(html):
    """El sitio contesta 200 con una página de error: se reconoce por el texto o porque no tiene
    la pestaña de detalle."""
    sopa = BeautifulSoup(html, "html.parser")
    principal = sopa.select_one("section#main") or sopa.body or sopa
    texto = _limpio(principal.get_text(" ")).lower()
    return sopa.select_one("#detalle") is None or any(e in texto for e in ERRORES)


def id_de_url(url):
    m = re.search(r"/tramite/(\d+)(?:/|$)", url or "")
    return int(m.group(1)) if m else None


def parsear_organismos(html):
    """[{id, nombre, ministerio, url}] de /tramites/organismos. El ministerio es la descripción
    de la tarjeta ("Ministerio de la Comunidad", "Dependiente del Poder Ejecutivo")."""
    sopa = BeautifulSoup(html, "html.parser")
    salida, vistos = [], set()
    for a in sopa.select('a[href*="/tramites/organismo/"]'):
        m = re.search(r"/tramites/organismo/(\d+)/", a.get("href", ""))
        titulo = a.select_one(".title")
        if not m or titulo is None or int(m.group(1)) in vistos:
            continue
        vistos.add(int(m.group(1)))
        descripcion = a.select_one(".description")
        salida.append({
            "id": int(m.group(1)),
            "nombre": _limpio(titulo.get_text(" ")),
            "ministerio": _limpio(descripcion.get_text(" ")) if descripcion else None,
            "url": urljoin(BASE, a["href"]),
        })
    return salida


def parsear_pagina_listado(html):
    """Ids de trámites de una página del listado y la URL de la página siguiente (o None)."""
    sopa = BeautifulSoup(html, "html.parser")
    principal = sopa.select_one("section#main") or sopa
    ids = []
    for a in principal.select('a[href^="/tramite/"], a[href*="formosa.gob.ar/tramite/"]'):
        i = id_de_url(a.get("href"))
        if i is not None and i not in ids:
            ids.append(i)
    siguiente = principal.select_one('ul.pagination a[aria-label="Siguiente"]')
    href = siguiente.get("href") if siguiente else None
    return ids, (urljoin(BASE, href) if href and href.startswith("/") else None)


def _seccion(detalle, titulo):
    """El cuerpo de un callout de #detalle por su título (h3/h4), sin el título."""
    for h in detalle.find_all(["h3", "h4"]):
        if _limpio(h.get_text()).lower().startswith(titulo):
            caja = h.find_parent("div")
            copia = BeautifulSoup(str(caja), "html.parser")
            copia.find(["h3", "h4"]).decompose()
            return texto_multilinea(copia) or None
    return None


def _bloque_lateral(sopa, rotulo):
    """El .header-box de la columna lateral cuyo rótulo empieza con `rotulo`."""
    # El rótulo puede no ser el primer div: delante suele ir el del ícono, vacío.
    for caja in sopa.select(".header-box"):
        for div in caja.find_all("div", recursive=False):
            if _limpio(div.get_text()).lower().startswith(rotulo):
                return caja
    return None


def _filas_costo(sopa):
    cuanto = sopa.select_one("#cuanto")
    filas = []
    for tr in cuanto.select("tr") if cuanto else []:
        celdas = [_limpio(td.get_text(" ")) for td in tr.find_all("td")]
        celdas = [c for c in celdas if c]
        if not celdas:
            continue
        if len(celdas) == 1:
            filas.append({"concepto": celdas[0], "importe": None})
        else:
            filas.append({"concepto": " ".join(celdas[:-1]), "importe": celdas[-1]})
    return filas


CAMPOS_OFICINA = {"domicilio": "domicilio", "teléfono": "telefono", "telefono": "telefono", "e-mail": "email", "email": "email", "horario de atención": "horario", "horario": "horario"}


def _oficinas(sopa):
    salida = []
    for panel in sopa.select("#donde .panel"):
        cuerpo = panel.select_one(".panel-collapse[id]")
        cabecera = panel.select_one(".panel-heading")
        if cuerpo is None:
            continue
        oficina = {"origenId": cuerpo["id"], "nombre": _limpio(cabecera.get_text(" ")) if cabecera else None}
        for tr in cuerpo.select("tr"):
            tds = tr.find_all("td")
            if len(tds) < 2:
                continue
            rotulo = _limpio(tds[0].get_text()).rstrip(":").strip().lower()
            # "Responsable:" (el nombre de una persona) no se guarda.
            campo = CAMPOS_OFICINA.get(rotulo)
            valor = _limpio(tds[1].get_text(" "))
            if campo and valor:
                oficina[campo] = valor
        salida.append(oficina)
    return salida


def _documentos(sopa, selector):
    """Formularios o normas: cada uno con su nombre y, si hay, el enlace. En las normas el nombre
    va en una fila con <strong> y el enlace en la fila siguiente, con un resumen."""
    tabla = sopa.select_one(selector)
    salida = []
    if tabla is None:
        return salida
    actual = None
    for tr in tabla.select("tr"):
        fuerte = tr.find("strong")
        enlaces = [a for a in tr.find_all("a") if a.get("href", "").lower().startswith(("http", "/"))]
        texto = _limpio(tr.get_text(" "))
        if not texto or texto.lower() in ("ninguno", "ninguna"):
            continue
        if fuerte is not None:
            actual = {"nombre": _limpio(fuerte.get_text(" ")), "url": None, "resumen": None}
            salida.append(actual)
            continue
        url = urljoin(BASE, enlaces[0]["href"]) if enlaces else None
        copia = BeautifulSoup(str(tr), "html.parser")
        for a in copia.find_all("a"):
            a.decompose()
        resto = texto_multilinea(copia)
        no_disponible = "no disponible" in texto.lower()
        if actual is not None and actual["url"] is None:
            actual["url"] = url
            actual["resumen"] = None if no_disponible else (resto or None)
            actual = None
        else:
            nombre = resto or (_limpio(enlaces[0].get_text(" ")) if enlaces else texto)
            salida.append({"nombre": nombre, "url": url, "resumen": None})
    return salida


def parsear_ficha(html):
    """La ficha de un trámite como diccionario. Los textos van tal cual (la sanitización la hace el
    importador); lo único que se descarta es el nombre de los responsables."""
    sopa = BeautifulSoup(html, "html.parser")
    detalle = sopa.select_one("#detalle")
    titulo = sopa.select_one("#content .title-box .title") or sopa.select_one("h2.title")

    modalidad = _bloque_lateral(sopa, "¿cómo se realiza")
    duracion = _bloque_lateral(sopa, "duración")
    destinado = _bloque_lateral(sopa, "trámite destinado")
    organismo = _bloque_lateral(sopa, "organismo responsable")
    org_enlace = organismo.find("a") if organismo else None
    org_id = re.search(r"/tramites/organismo/(\d+)/", org_enlace.get("href", "")) if org_enlace else None
    pasos = sopa.select_one(".steps")

    return {
        "titulo": _limpio(titulo.get_text(" ")) if titulo else None,
        "descripcion": _seccion(detalle, "descripción"),
        "requisitos": _seccion(detalle, "requisitos"),
        "observaciones": _seccion(detalle, "observaciones"),
        "modalidad": [_limpio(p.get_text(" ")) for p in modalidad.find_all("p")] if modalidad else [],
        "duracion": _limpio(duracion.find("h6").get_text(" ")) if duracion and duracion.find("h6") else None,
        "destinatarios": [_limpio(a.get_text(" ")) for a in destinado.find_all("a")] if destinado else [],
        "pasoAPaso": texto_multilinea(pasos) or None,
        "organismo": {
            "id": int(org_id.group(1)) if org_id else None,
            "nombre": _limpio(org_enlace.get_text(" ")) if org_enlace else None,
        },
        "costos": _filas_costo(sopa),
        "oficinas": _oficinas(sopa),
        "formularios": _documentos(sopa, "#formularios"),
        "normas": _documentos(sopa, "#normas"),
    }


# ---------------------------------------------------------------------------------------------
# Red: un pedido por segundo, robots.txt y caché


class ErrorDeSitio(Exception):
    pass


class Cliente:
    def __init__(self, cache_dir, sesion=None, intervalo=INTERVALO, dormir=time.sleep, reloj=time.monotonic):
        import requests  # solo hace falta para la red: el parseo se prueba sin requests

        self.sesion = sesion or requests.Session()
        self.sesion.headers["User-Agent"] = USER_AGENT
        self.intervalo = intervalo
        self.dormir = dormir
        self.reloj = reloj
        self.ultimo = None
        self.robots = {}
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.pedidos = 0
        self.desde_cache = 0

    def _esperar_turno(self):
        if self.ultimo is not None:
            falta = self.intervalo - (self.reloj() - self.ultimo)
            if falta > 0:
                self.dormir(falta)
        self.ultimo = self.reloj()

    def _permitido(self, url):
        partes = urlparse(url)
        host = f"{partes.scheme}://{partes.netloc}"
        if host not in self.robots:
            rp = urllib.robotparser.RobotFileParser()
            self._esperar_turno()
            self.pedidos += 1
            try:
                r = self.sesion.get(f"{host}/robots.txt", timeout=30)
                # Sin robots.txt (404) todo está permitido; un error del servidor, nada.
                if r.status_code >= 500:
                    rp.disallow_all = True
                elif r.status_code >= 400:
                    rp.allow_all = True
                else:
                    rp.parse(r.text.splitlines())
            except Exception:
                rp.disallow_all = True
            self.robots[host] = rp
        return self.robots[host].can_fetch(USER_AGENT, url)

    def _pedir(self, metodo, url, **kwargs):
        if not self._permitido(url):
            raise ErrorDeSitio(f"robots.txt no permite {url}")
        ultimo_error = None
        for intento in range(1, REINTENTOS + 1):
            self._esperar_turno()
            self.pedidos += 1
            try:
                r = self.sesion.request(metodo, url, timeout=30, **kwargs)
                if r.status_code >= 500:
                    raise ErrorDeSitio(f"HTTP {r.status_code}")
                return r
            except Exception as e:  # red o 5xx: se reintenta con espera creciente
                ultimo_error = e
                if intento < REINTENTOS:
                    self.dormir(2 ** intento)
        raise ErrorDeSitio(f"{metodo} {url}: {ultimo_error}")

    def _ruta_cache(self, clave):
        nombre = re.sub(r"[^a-z0-9_.-]+", "_", clave.lower()).strip("_")
        return self.cache_dir / f"{nombre}.html"

    def get_html(self, url, clave=None, usar_cache=True):
        """HTML decodificado. Con `clave` se guarda en la caché (y se lee de ahí si ya está)."""
        ruta = self._ruta_cache(clave) if clave else None
        if usar_cache and ruta and ruta.exists():
            self.desde_cache += 1
            return decodificar(ruta.read_bytes())
        r = self._pedir("GET", url)
        if r.status_code >= 400:
            raise ErrorDeSitio(f"HTTP {r.status_code} en {url}")
        if ruta:
            ruta.write_bytes(r.content)
        return decodificar(r.content)

    def head(self, url):
        """Código de estado de un HEAD (sin bajar el archivo); si el servidor no acepta HEAD, un GET
        en streaming que se cierra sin leer el cuerpo."""
        r = self._pedir("HEAD", url, allow_redirects=True)
        if r.status_code in (405, 501):
            r = self._pedir("GET", url, allow_redirects=True, stream=True)
            r.close()
        return r.status_code, r.headers.get("Content-Type")


# ---------------------------------------------------------------------------------------------
# Recorrido


def recorrer_listado(cliente, cache_dir, log=print):
    """Organismos del sitio y los ids de trámites de cada uno, siguiendo la paginación con la
    cookie de la sesión. El resultado de cada organismo se guarda entero en la caché: la paginación
    depende de la sesión, así que un organismo a medias se vuelve a recorrer desde la página 1."""
    organismos = parsear_organismos(cliente.get_html(f"{BASE}/tramites/organismos", clave="organismos"))
    listados = Path(cache_dir) / "listados"
    listados.mkdir(parents=True, exist_ok=True)
    for org in organismos:
        guardado = listados / f"organismo_{org['id']}.json"
        if guardado.exists():
            org.update(json.loads(guardado.read_text(encoding="utf-8")))
            continue
        ids, paginas, url = [], 0, org["url"]
        vistas = set()
        while url and url not in vistas and paginas < 50:
            vistas.add(url)
            html = cliente.get_html(url)  # sin caché: depende de la sesión
            paginas += 1
            nuevos, url = parsear_pagina_listado(html)
            ids += [i for i in nuevos if i not in ids]
        org.update({"tramites": ids, "paginas": paginas})
        guardado.write_text(json.dumps({"tramites": ids, "paginas": paginas}), encoding="utf-8")
        log(f"  {org['nombre']}: {len(ids)} trámites en {paginas} páginas")
    return organismos


def verificar_enlaces(cliente, urls, cache_dir, log=print):
    """{url: {"estado": "ok"|"roto", "http": código}} con pedidos HEAD, guardado en la caché."""
    ruta = Path(cache_dir) / "enlaces.json"
    resultado = json.loads(ruta.read_text(encoding="utf-8")) if ruta.exists() else {}
    pendientes = [u for u in sorted(set(urls)) if u not in resultado]
    for n, url in enumerate(pendientes, 1):
        try:
            codigo, tipo = cliente.head(url)
            roto = codigo >= 400 or (tipo or "").startswith("text/html") and url.lower().endswith(".pdf")
            resultado[url] = {"estado": "roto" if roto else "ok", "http": codigo}
        except ErrorDeSitio as e:
            resultado[url] = {"estado": "roto", "http": None, "error": str(e)}
        if n % 25 == 0:
            ruta.write_text(json.dumps(resultado, indent=1), encoding="utf-8")
            log(f"  enlaces: {n}/{len(pendientes)}")
    ruta.write_text(json.dumps(resultado, indent=1), encoding="utf-8")
    return resultado


ultimo_informe = None


def read(records, cache_dir="data/cache_html", muestra=None, verificar=True, cliente=None, log=print):
    """Los registros del XML enriquecidos con "detalle" (la ficha parseada) y "enListado"."""
    global ultimo_informe
    cliente = cliente or Cliente(cache_dir)
    capturado = datetime.now(timezone.utc).isoformat(timespec="seconds")

    log("Recorriendo el listado por organismos...")
    organismos = recorrer_listado(cliente, cache_dir, log)
    en_listado = {}
    for org in organismos:
        for i in org["tramites"]:
            en_listado.setdefault(i, org)

    elegidos = records if muestra is None else records[:muestra]
    salida, errores, fuera = [], [], []
    log(f"Bajando {len(elegidos)} fichas...")
    for n, r in enumerate(elegidos, 1):
        tid = id_de_url(r["url"])
        registro = {**r, "detalle": None, "enListado": tid in en_listado}
        if tid is None:
            errores.append({"titulo": r["titulo"], "url": r["url"], "motivo": "la URL no trae el id del trámite"})
            salida.append(registro)
            continue
        url = f"{BASE}/tramite/{tid}/detalle_del_tramite"
        clave = f"tramite_{tid}"
        try:
            html = cliente.get_html(url, clave=clave)
            if es_pagina_de_error(html):
                registro["error"] = "la ficha responde con la página de error del sitio"
                errores.append({"titulo": r["titulo"], "url": url, "motivo": registro["error"]})
            else:
                ficha = parsear_ficha(html)
                ruta = cliente._ruta_cache(clave)
                fecha = datetime.fromtimestamp(ruta.stat().st_mtime, timezone.utc).isoformat(timespec="seconds") if ruta.exists() else capturado
                registro["detalle"] = {**ficha, "verificadoEn": fecha}
        except ErrorDeSitio as e:
            registro["error"] = str(e)
            errores.append({"titulo": r["titulo"], "url": url, "motivo": str(e)})
        if not registro["enListado"]:
            fuera.append(registro)
        salida.append(registro)
        if n % 20 == 0:
            log(f"  {n}/{len(elegidos)}")

    enlaces = {}
    if verificar:
        urls = [d["url"] for x in salida if x["detalle"] for d in x["detalle"]["formularios"] + x["detalle"]["normas"] if d["url"]]
        log(f"Verificando {len(set(urls))} enlaces de formularios y normas (HEAD)...")
        enlaces = verificar_enlaces(cliente, urls, cache_dir, log)
        for x in salida:
            for d in (x["detalle"] or {}).get("formularios", []) + (x["detalle"] or {}).get("normas", []):
                if d["url"]:
                    d["enlace"] = enlaces.get(d["url"], {"estado": "sin verificar"})

    ultimo_informe = {
        "capturadoEn": capturado,
        "organismos": organismos,
        "fichas": len(elegidos),
        "fichasLeidas": sum(1 for x in salida if x["detalle"]),
        "errores": errores,
        "fueraDelListado": fuera,
        "idsDelListado": sorted(en_listado),
        "enlaces": enlaces,
        "pedidos": cliente.pedidos,
        "desdeCache": cliente.desde_cache,
    }
    return salida

