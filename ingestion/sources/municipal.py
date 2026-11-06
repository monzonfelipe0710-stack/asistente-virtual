"""Trámites de la Municipalidad de la Ciudad de Formosa (formosatuciudad.gob.ar).

read(cache_dir, ...) recorre el listado /tramites, baja cada ficha y la tabla del valor del módulo
(PDF) y devuelve el catálogo con la forma que espera el importador: {sectores, tramites, ...}. Cada
trámite trae `detalle` con las mismas claves que la ficha del portal provincial.
"""

import hashlib
import html as html_lib
import re
import unicodedata
from datetime import date, datetime, timezone
from io import BytesIO
from urllib.parse import quote, unquote, urljoin, urlparse

from bs4 import BeautifulSoup, Tag

from sources.detalle_html import Cliente, ErrorDeSitio, _limpio, texto_multilinea, verificar_enlaces

BASE = "https://formosatuciudad.gob.ar"
LISTADO = f"{BASE}/tramites"
PAGINA_MODULO = f"{BASE}/atención-ciudadana/codigo-tarifario-y-tributario"
FUENTE = "municipalidad-formosa"
LOCALIDAD = "Formosa"
RAIZ = {"nombre": "Municipalidad de la Ciudad de Formosa", "tipo": "ORGANISMO", "jurisdiccion": "MUNICIPAL", "localidad": LOCALIDAD}

# ---------------------------------------------------------------------------------------------
# Texto


def clave(texto):
    sin_tildes = unicodedata.normalize("NFD", texto or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", sin_tildes.lower()).strip()


def url_canonica(href):
    p = urlparse(urljoin(BASE + "/", href.strip()))
    return p._replace(path=quote(unquote(p.path), safe="/-._~!$&'()*+,;=:@"), fragment="").geturl()


MINUSCULAS = {"de", "del", "la", "las", "los", "el", "y", "e", "o", "a", "en", "por", "para", "con", "sobre"}


def titulo_propio(texto):
    palabras = _limpio(texto).split(" ")
    salida = []
    for i, p in enumerate(palabras):
        if re.fullmatch(r"\(?[A-ZÁÉÍÓÚÑ]{2,5}\)?", p) and p.startswith("("):
            salida.append(p)
        elif i > 0 and p.lower() in MINUSCULAS:
            salida.append(p.lower())
        else:
            salida.append(p[:1].upper() + p[1:].lower())
    return " ".join(salida)


def sin_mayusculas_sostenidas(texto, referencia=""):
    """"OBRA NUEVA PLAN PROCREAR" -> "Obra nueva plan PROCREAR": conserva las siglas que el
    listado escribe en mayúscula."""
    letras = [c for c in texto or "" if c.isalpha()]
    if not letras or sum(c.isupper() for c in letras) < 0.8 * len(letras) or not re.search(r"[A-ZÁÉÍÓÚÑ]{4}", texto):
        return texto
    siglas = {p for p in re.findall(r"\b[A-ZÁÉÍÓÚÑ0-9]{2,}\b", referencia or "")}
    palabras = texto.lower().split(" ")
    salida = [p.upper() if p.upper() in siglas else p for p in palabras]
    return " ".join(salida)[:1].upper() + " ".join(salida)[1:]


def numero_ar(n):
    entero, decimales = f"{n:,.2f}".split(".")
    return f"{entero.replace(',', '.')},{decimales}"


def cantidad_ar(n):
    return (f"{n:.2f}".rstrip("0").rstrip(".")).replace(".", ",")


def a_numero(crudo):
    t = crudo.replace("$", "").strip()
    if "," in t and "." in t:
        t = t.replace(".", "").replace(",", ".")
    elif "," in t:
        t = t.replace(",", ".")
    try:
        return float(t)
    except ValueError:
        return None


# ---------------------------------------------------------------------------------------------
# Privacidad: solo contactos institucionales, sin nombres de personas

DOMINIOS_INSTITUCIONALES = (".gob.ar", ".gov.ar")
SIN_CORREO = "(el correo figura en la fuente oficial)"
TITULOS = r"(?:Lic|Licenciad[oa]|Arq|Ing|Dr|Dra|Sr|Sra|Srta|Prof|Cdor|Cdora|Cr|Cra|Esc|Abog|Tec|Téc)\."
NOMBRE_PROPIO = r"[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+"
CARGOS = r"(?:Intendent[ea]|Director|Directora|Secretari[oa]|Subsecretari[oa]|Jef[ea]|President[ea]|Juez|Jueza|Coordinador|Coordinadora|Ministr[oa]|Concejal)\b"
PERSONA = re.compile(rf"\s*\b{TITULOS}\s*(?!{CARGOS})(?:{NOMBRE_PROPIO}\s*){{1,4}}")
RESPONSABLE = re.compile(r"(?im)^\s*(?:[-•*]\s*)?(?:responsable|a cargo|encargad[oa])\s*:.*$\n?")
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
SIN_TELEFONO = "(el teléfono figura en la fuente oficial)"
# Celulares: rotulados ("Cel:", "WhatsApp") o con la forma 3704-NNNNNN y sus continuaciones
# "/336516". Los fijos de siete cifras (4436181) y los 0800 quedan.
NUMERO_CEL = r"(?:\+?54\s?9?\s?)?\(?0?370\)?[\s.-]?(?:4[\s.-]?\d{6}|\d{6})(?:\s?/\s?\d{6})*|\b15[\s-]?\d{6}\b"
CELULAR = re.compile(
    rf"(?i)\b(?:cel(?:ular)?|whats?app|wsp|m[oó]vil)\b\.?\s*:?\s*(?:{NUMERO_CEL})(?:\s*\(\s*solo\s+whats?app\s*\))?"
    rf"|(?<![\d-])(?:{NUMERO_CEL})(?![\d-])(?:\s*\(\s*solo\s+whats?app\s*\))?"
)


def es_institucional(email):
    return email.lower().endswith(DOMINIOS_INSTITUCIONALES)


def enmascarar(valor):
    """Lo que se descarta tampoco queda en el informe: del correo, solo el dominio; del nombre, el
    título o el rótulo."""
    valor = valor.strip()
    if "@" in valor:
        return f"***@{valor.rsplit('@', 1)[1]}"
    if CELULAR.fullmatch(valor):
        return re.sub(r"\d", "*", valor)
    rotulo = re.match(r"^(?:[-•*]\s*)?([^:]+:)", valor) or re.match(rf"^({TITULOS})", valor)
    return f"{rotulo.group(1)} ***" if rotulo else "***"


def sin_datos_personales(texto, descartes=None):
    """Saca nombres de personas con título ("Lic. Fulano") o rotuladas como responsables, y los
    correos que no son de un dominio oficial (cuentas personales como gmail)."""
    if not texto:
        return texto
    descartes = descartes if descartes is not None else []

    def persona(m):
        descartes.append({"tipo": "nombre de persona", "valor": enmascarar(m.group(0))})
        return " "

    def correo(m):
        if es_institucional(m.group(0)):
            return m.group(0)
        descartes.append({"tipo": "correo no institucional", "valor": enmascarar(m.group(0))})
        return SIN_CORREO

    t = RESPONSABLE.sub(lambda m: (descartes.append({"tipo": "responsable", "valor": enmascarar(m.group(0))}), "")[1], texto)
    t = PERSONA.sub(persona, t)
    t = EMAIL.sub(correo, t)

    def celular(m):
        descartes.append({"tipo": "teléfono celular", "valor": re.sub(r"\d", "*", m.group(0))})
        return SIN_TELEFONO

    t = CELULAR.sub(celular, t)
    t = re.sub(rf"(?:{re.escape(SIN_TELEFONO)}[\s/,y-]*){{2,}}", SIN_TELEFONO + " ", t)
    t = re.sub(r"[ \t]+([).,;:])", r"\1", re.sub(r"\(\s*\)", "", t))
    return re.sub(r"[ \t]{2,}", " ", t).strip()


def _correo_ofuscado(script):
    """Joomla escribe el correo con JS para esconderlo de los robots: se reconstruye la variable
    addy_text, que es la concatenación de literales con entidades HTML."""
    m = re.search(r"addy_text\w*\s*=\s*((?:'[^']*'\s*\+?\s*)+)", script.get_text() if script else "")
    return html_lib.unescape("".join(re.findall(r"'([^']*)'", m.group(1)))) if m else None


def preparar_cuerpo(cuerpo, descartes):
    for span in cuerpo.select('span[id^="cloak"]'):
        script = span.find_next_sibling("script")
        email = _correo_ofuscado(script)
        if email and es_institucional(email):
            span.replace_with(email)
        else:
            if email:
                descartes.append({"tipo": "correo no institucional", "valor": enmascarar(email)})
            span.replace_with(SIN_CORREO)
    for img in cuerpo.find_all("img", alt=re.compile(r"(?i)whats?app|celular")):
        img.replace_with("WhatsApp: ")
    for basura in cuerpo.find_all(["script", "style", "img", "hr"]):
        basura.decompose()
    for a in cuerpo.find_all("a", href=lambda h: h and h.startswith("#")):
        a.unwrap()
    return cuerpo


# ---------------------------------------------------------------------------------------------
# Listado y sectores

SECTORES = {
    "lugares de atencion y pagos habilitados": None,
    "administracion de ingresos municipales aim": "Administración de Ingresos Municipales (AIM)",
    "direccion de bromatologia higiene y comercializacion": "Dirección de Bromatología, Higiene y Comercialización",
    "secretaria de obras publicas": "Secretaría de Obras Públicas",
    "direccion de obras privadas": "Dirección de Obras Privadas",
    "direccion de catastro y tierras fiscales": "Dirección de Catastro y Tierras Fiscales",
    "direccion de planeamiento urbano": "Dirección de Planeamiento Urbano",
    "direccion de obras publicas": "Dirección de Obras Públicas",
    "tribunal de administracion de faltas": "Tribunal de Administración de Faltas",
    "juzgados de faltas": "Tribunal de Administración de Faltas",
    "transito transporte y emergencia": "Tránsito, Transporte y Emergencia",
    "habilitaciones comerciales": "Habilitaciones Comerciales",
}
DOCUMENTO = re.compile(r"\.(?:pdf|docx?|xlsx?|odt|ods|rtf)$", re.I)


def nombre_de_sector(rotulo, avisos):
    k = clave(rotulo)
    if k in SECTORES:
        return SECTORES[k]
    avisos.append(f'Sección del listado sin nombre conocido: "{rotulo}" (se usa "{titulo_propio(rotulo)}")')
    return titulo_propio(rotulo)


def parsear_listado(html):
    """Fichas del listado con su sección (y área o dirección), y los enlaces que no son fichas."""
    sopa = BeautifulSoup(html, "html.parser")
    cuerpo = sopa.select_one('[itemprop="articleBody"]')
    menu = cuerpo.select_one("ul.menu-ancla") if cuerpo else None
    if menu is None:
        raise ErrorDeSitio("el listado no tiene el índice de secciones (ul.menu-ancla)")
    elementos = cuerpo.find_all(True)
    fichas, otros, vistos = [], [], set()
    seccion = area = None
    for el in elementos[elementos.index(menu) + 1:]:
        clases = el.get("class") or []
        if el.name == "div" and "bajada" in clases:
            if "principal" in clases:
                seccion, area = _limpio(el.get_text(" ")), None
            elif "secundario" in clases:
                area = _limpio(el.get_text(" "))
            continue
        if el.name != "a" or not el.get("href") or seccion is None or el.find_parent(class_="menu-ancla"):
            continue
        href = el["href"].strip()
        if href.startswith("#") or href in ("/", ""):
            continue
        url = url_canonica(href)
        if url in vistos:
            continue
        vistos.add(url)
        texto = _limpio(el.get_text(" ")).lstrip("- ").strip() or el.get("title") or url
        partes = urlparse(url)
        ruta = unquote(partes.path)
        if partes.netloc != urlparse(BASE).netloc:
            otros.append({"url": url, "texto": texto, "seccion": seccion, "motivo": "enlace a otro sitio"})
        elif DOCUMENTO.search(ruta):
            otros.append({"url": url, "texto": texto, "seccion": seccion, "motivo": "documento suelto del listado (no es una ficha)"})
        elif ruta.strip("/").count("/") > 0:
            otros.append({"url": url, "texto": texto, "seccion": seccion, "motivo": "página de otra sección del sitio (no es una ficha de trámite)"})
        else:
            fichas.append({"url": url, "titulo": texto, "seccion": seccion, "area": area, "ruta": ruta})
    return fichas, otros


def ubicar(ficha, avisos):
    """(sector, padre, área) de una ficha. Un subtítulo que empieza con "Dirección" es una dirección
    de la secretaría (un sector hijo); otro subtítulo es un área interna y queda como dato."""
    seccion = nombre_de_sector(ficha["seccion"], avisos)
    area = ficha.get("area")
    if seccion is None:
        return RAIZ["nombre"], None, None
    if area and clave(area).startswith("direccion "):
        return nombre_de_sector(area, avisos), seccion, None
    return seccion, RAIZ["nombre"], (titulo_propio(area) if area else None)


def armar_sectores(ubicaciones):
    sectores = [dict(RAIZ)]
    vistos = {RAIZ["nombre"]}
    for sector, padre, _ in ubicaciones:
        cadena = [(padre, RAIZ["nombre"])] if padre and padre != RAIZ["nombre"] else []
        cadena.append((sector, padre))
        for nombre, de in cadena:
            if nombre in vistos:
                continue
            vistos.add(nombre)
            sectores.append({"nombre": nombre, "tipo": "DEPARTAMENTO", "padre": de or RAIZ["nombre"], "jurisdiccion": None, "localidad": None})
    return sectores


# ---------------------------------------------------------------------------------------------
# Valor del módulo (PDF de la AIM)

CATEGORIAS = [
    ("comercio", "contribucion que incide sobre la actividad comercial"),
    ("tasa_unica", "tasa unica de servicios"),
    ("automotores", "contribucion por servicios que inciden sobre los vehiculos"),
    ("publicidad", "contribucion por servicios relativos a la publicidad"),
    ("espectaculos", "contribucion por servicios publicos relativos a espectaculos"),
    ("cementerios", "contribucion por servicios relativos a los cementerios"),
    ("construccion", "contribucion que inciden sobre la construccion"),
    ("antenas_instalacion", "contribucion que incide sobre la construccion y registracion"),
    ("antenas_verificacion", "contribucion que incide sobre la verificacion de antenas"),
    ("servicios_varios", "contribucion por servicios varios"),
    ("habilitaciones", "contribucion que incide sobre las habilitaciones"),
    ("espacio_publico", "contribucion que incide sobre la ocupacion"),
    ("sanciones", "sanciones"),
    ("inmobiliario", "impuesto inmobiliario"),
]
NUMERO = r"\$?\s?\d{1,3}(?:[.,]?\d{3})*[.,]\d{2}"


def _fecha(dmy):
    d, m, a = (int(x) for x in dmy.split("/"))
    return date(a, m, d)


def leer_tabla_modulo(texto, hoy):
    """{legible, motivo, desde, categorias: {clave: [valores]}, vigente: {desde, indice}} a partir
    del texto del PDF. Es legible solo si cada categoría trae un valor por cada fecha, positivos y
    sin bajar de una fecha a la siguiente."""
    plano = re.sub(r"\s+", " ", texto or "")
    fechas = re.findall(r"(\d{2}/\d{2}/\d{4})\s*:\s*\d+\s*%", plano)
    resultado = {"legible": False, "motivo": None, "desde": fechas, "categorias": {}, "vigente": None}
    if not fechas:
        resultado["motivo"] = "el PDF no trae las fechas de vigencia"
        return resultado
    sin_tildes = unicodedata.normalize("NFD", plano).encode("ascii", "ignore").decode().lower()
    n = len(fechas)
    for k, rotulo in CATEGORIAS:
        patron = re.escape(rotulo).replace(r"\ ", r"\s+")
        m = re.search(rf"{patron}[^0-9$]{{0,400}}?((?:{NUMERO}\s+){{{n - 1}}}{NUMERO})", sin_tildes)
        if m:
            valores = [a_numero(v) for v in re.findall(NUMERO, m.group(1))]
            if len(valores) == n and all(v and v > 0 for v in valores) and valores == sorted(valores):
                resultado["categorias"][k] = valores
    vigentes = [i for i, f in enumerate(fechas) if _fecha(f) <= hoy]
    if not vigentes:
        resultado["motivo"] = f"ninguna fecha de vigencia del PDF ({', '.join(fechas)}) es anterior a la consulta"
    elif not resultado["categorias"]:
        resultado["motivo"] = "no se pudo leer ningún valor de la tabla"
    else:
        resultado["legible"] = True
        resultado["vigente"] = {"desde": fechas[vigentes[-1]], "indice": vigentes[-1]}
        faltan = [k for k, _ in CATEGORIAS if k not in resultado["categorias"]]
        if faltan:
            resultado["motivo"] = f"categorías ilegibles: {', '.join(faltan)}"
    return resultado


def texto_de_pdf(contenido):
    from pypdf import PdfReader

    return "\n".join(p.extract_text() or "" for p in PdfReader(BytesIO(contenido)).pages)


def valor_modulo(modulo, categoria):
    if not modulo or not modulo.get("legible") or categoria not in modulo["categorias"]:
        return None
    return modulo["categorias"][categoria][modulo["vigente"]["indice"]], modulo["vigente"]["desde"]


# Conceptos del Código Tarifario 2026 (Ord. 7147/17 y modificatorias): el tributo cuyo módulo los
# valoriza y, si el Código la fija, la cantidad de módulos. Un concepto que no está acá queda con lo
# que publica la ficha (la cantidad de módulos sin monto, o los pesos con una advertencia).
CODIGO_TARIFARIO = "Código Tarifario 2026"
CONCEPTOS = [
    (r"libre deuda por infracciones", "servicios_varios", "art. 24 inc. t.7", 2),
    (r"certificados? de libre deuda", "servicios_varios", "art. 24 inc. t.5", 4),
    (r"libre deuda (?:emitida por )?(?:la )?administracion de ingresos municipales", "servicios_varios", "art. 24 inc. t.5", 4),
    (r"certificaciones?,? copias de documentos", "servicios_varios", "art. 24 inc. t.3", 2.5),
    (r"acogimiento y/?o renovacion de exencion", "servicios_varios", "art. 24 inc. t.2", 2.5),
    (r"cualquier presentacion,? solicitud o nota simple", "servicios_varios", "art. 24 inc. t.1", 1.5),
    (r"estudio de dominio", "servicios_varios", "art. 24 inc. n.3", 6),
    (r"emision del certificado (?:o permiso )?de renovacion", "servicios_varios", "art. 24 inc. t.10", 5),
    (r"emision del certificado (?:o permiso )?de habilitacion", "servicios_varios", "art. 24 inc. t.9", 5),
    (r"renovacion (?:semestral )?de (?:la )?(?:libreta|carnet) de sanidad", "servicios_varios", "art. 24 inc. u.4", 5),
    (r"(?:libreta|carnet) de sanidad", "servicios_varios", "art. 24 inc. u.3", 8),
    (r"(?:superficie|dimensiones) del local a habilitar", "habilitaciones", "art. 25", None),
]
NOMBRES_CATEGORIA = {"servicios_varios": "servicios varios", "habilitaciones": "habilitaciones"}


def _plano(texto):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFD", texto or "").encode("ascii", "ignore").decode().lower())


def concepto_del_codigo(concepto):
    """(categoría, artículo, cantidad o None) del concepto en el Código Tarifario, o None."""
    plano = _plano(concepto)
    for patron, categoria, articulo, cantidad in CONCEPTOS:
        if re.search(patron, plano):
            return categoria, articulo, cantidad
    return None


def categoria_de(concepto):
    hallado = concepto_del_codigo(concepto)
    return hallado[:2] if hallado else (None, None)


# ---------------------------------------------------------------------------------------------
# Costos

NO_COSTO = re.compile(r"\bno tiene costo\b|\bsin costo\b|\bgratuit[oa]\b", re.I)
MODULOS = re.compile(r"(\d+(?:[.,]\d+)?)\s*m[óo]dulos?\b", re.I)
PESOS_VIEJOS = re.compile(r"\(?\$\s?[\d.,]+\)?(?:\s*=\s*\$\s?[\d.,]+)?\.?")
UNIDADES_TRIBUTARIAS = re.compile(
    r"(?i)(?:tasa administrativa de\s+)?\d+(?:[.,]\d+)?\s*(?:unidades tributarias|u\.?\s?t\.?)(?=[\s(:]|$)"
    r"\s*(?:\(\s*1\s*u\.?\s?t\.?\s*:?\s*\$\s?[\d.,]+\s*\))?"
)
MONTO_AL_INICIO = re.compile(r"^\$\s?(\d[\d.,]*\d|\d)\s+(?!x\s?m)(\S.*)$", re.I)
MONTO_AL_FINAL = re.compile(r"^(.*\S)\s*:\s*\$\s?(\d[\d.,]*\d|\d)\s*\.?$")
CONTEXTO_DE_PAGO = re.compile(r"(?i)\b(?:estampillas?|sellados?|estampillado|arancel|tasa|costo)\b")
ADVERTENCIA = "monto publicado en el portal, puede estar desactualizado; confirmalo en la oficina"
GENERICO = re.compile(r"(?i)^(?:el\s+)?(?:costo|valor)(?:\s+del\s+tr[áa]mite)?\b")


def calculado(cantidad, categoria, modulo, consulta):
    """'4 módulos: $4.029,40, calculado con el valor del módulo (servicios varios: $1.007,35) vigente
    desde 01/10/2026, según el Código Tarifario 2026; fuente: portal oficial, consultado el ...', o
    (None, None) si no hay un valor legible del módulo de esa categoría."""
    valor = valor_modulo(modulo, categoria)
    if valor is None:
        return None, None
    precio, desde = valor
    monto = round(cantidad * precio + 1e-9, 2)
    nombre = NOMBRES_CATEGORIA.get(categoria, categoria.replace("_", " "))
    texto = (f"{cantidad_ar(cantidad)} módulos: ${numero_ar(monto)}, calculado con el valor del módulo "
             f"({nombre}: ${numero_ar(precio)}) vigente desde {desde}, según el {CODIGO_TARIFARIO}; "
             f"fuente: portal oficial, consultado el {consulta}")
    return texto, {"monto": monto, "valorModulo": precio, "desde": desde}


def fila_de_modulos(concepto, cantidad, modulo, consulta, avisos, titulo, categoria=None, articulo=None):
    n_txt = cantidad_ar(cantidad)
    if categoria is None:
        categoria, articulo = categoria_de(concepto)
    texto, datos = calculado(cantidad, categoria, modulo, consulta) if categoria else (None, None)
    if texto is None:
        motivo = ("no se pudo leer el valor del módulo" if modulo is None or not modulo.get("legible")
                  else "el concepto no está en la tabla de conceptos del Código Tarifario" if categoria is None
                  else f"no se pudo leer el valor del módulo de {categoria}")
        avisos.append({"tramite": titulo, "concepto": concepto, "modulos": n_txt, "motivo": motivo})
        return {"concepto": concepto, "importe": f"{n_txt} módulos (el valor en pesos no está cargado; fuente: portal oficial, consultado el {consulta})", "modulos": cantidad, "categoria": categoria}
    return {"concepto": concepto, "importe": texto, "modulos": cantidad, "categoria": categoria, "articulo": articulo, **datos}


def _concepto_limpio(linea):
    t = UNIDADES_TRIBUTARIAS.sub(" ", linea)
    t = re.sub(r"\(?\$\s?[\d.,]+\)?", " ", t)
    t = re.sub(r"\(\s*\)", " ", t)
    t = re.sub(r"\s+", " ", t).strip(" :-.")
    return t[:1].upper() + t[1:]


def fila_en_pesos(linea, concepto, importe, modulo, consulta, avisos, titulo, viejos):
    """Pesos (o unidades tributarias) que publica la ficha. Si el Código Tarifario fija la cantidad
    de módulos del concepto, se calcula con el módulo vigente y lo viejo va al informe; si no, queda
    como está, con la advertencia."""
    hallado = concepto_del_codigo(concepto) or (concepto_del_codigo(titulo) if GENERICO.match(concepto) else None)
    if hallado and hallado[2] is not None:
        categoria, articulo, cantidad = hallado
        fila = fila_de_modulos(concepto, cantidad, modulo, consulta, avisos, titulo, categoria, articulo)
        if "monto" in fila:
            viejos.append({"tramite": titulo, "texto": linea, "reemplazo": fila["importe"]})
            return fila
    return {"concepto": concepto, "importe": f"{importe} ({ADVERTENCIA})" if importe else ADVERTENCIA}


def costos_de(lineas, modulo, consulta, avisos, titulo, viejos):
    filas, encabezado = [], None
    for crudo in lineas:
        linea = re.sub(r"^[-•*·\s]+|^\d{1,2}\s?[.)-]\s?-?\s*", "", crudo).strip()
        if not linea:
            continue
        m = MODULOS.search(linea)
        if m:
            concepto = linea[: m.start()].strip(" :-")
            if (not concepto or re.match(r"(?i)hasta|m[áa]s de", concepto)) and encabezado:
                concepto = f"{encabezado} ({concepto[:1].lower() + concepto[1:]})" if concepto else encabezado
            resto = linea[m.end():]
            if PESOS_VIEJOS.search(resto) or PESOS_VIEJOS.search(concepto):
                viejos.append({"tramite": titulo, "texto": linea})
            concepto = sin_mayusculas_sostenidas(PESOS_VIEJOS.sub("", concepto).strip(" :-"))
            filas.append(fila_de_modulos(concepto or "Valor del trámite", a_numero(m.group(1)), modulo, consulta, avisos, titulo))
            continue
        if NO_COSTO.search(linea):
            filas.append({"concepto": linea, "importe": None, "sinCosto": True})
            continue
        ut = UNIDADES_TRIBUTARIAS.search(linea)
        inicio, final = MONTO_AL_INICIO.match(linea), MONTO_AL_FINAL.match(linea)
        mayusculas = linea.upper() == linea and re.search(r"[A-ZÁÉÍÓÚÑ]{4}", linea)
        if inicio and not ut:
            filas.append(fila_en_pesos(linea, inicio.group(2).rstrip(". "), f"$ {inicio.group(1)}", modulo, consulta, avisos, titulo, viejos))
        elif final and not ut:
            filas.append(fila_en_pesos(linea, final.group(1), f"$ {final.group(2)}", modulo, consulta, avisos, titulo, viejos))
        elif linea.endswith(":") or mayusculas or (len(linea) <= 80 and not re.search(r"\d", linea)):
            if PESOS_VIEJOS.search(linea):
                viejos.append({"tramite": titulo, "texto": linea})
            sin_pesos = re.sub(r"(?i)\s*art\.?\s*\d+\s*inc\.?\s*[a-z]\b", "", PESOS_VIEJOS.sub("", linea))
            encabezado = sin_mayusculas_sostenidas(sin_pesos.strip(" :-"))
        elif ut or re.search(r"\$\s?\d", linea):
            hallado = concepto_del_codigo(linea)
            if hallado and hallado[2] is not None:
                filas.append(fila_en_pesos(linea, _concepto_limpio(linea), None, modulo, consulta, avisos, titulo, viejos))
            else:
                filas.append({"concepto": linea, "importe": ADVERTENCIA})
        else:
            filas.append({"concepto": linea, "importe": None})
    if len(filas) == 1 and filas[0].get("sinCosto"):
        return [{"concepto": filas[0]["concepto"], "importe": "$ 0"}]
    return compactar(filas, consulta)


def compactar(filas, consulta):
    """Con dos montos o más, una lista numerada solo con concepto y monto, y al pie el origen del
    cálculo (una vez por tributo) y la advertencia de los montos publicados: el chat ve los primeros
    300 caracteres del costo y la leyenda repetida en cada fila dejaba afuera los últimos montos."""
    con_monto = [f for f in filas if f.get("importe")]
    if len(con_monto) < 2:
        return filas
    calculadas = [f for f in con_monto if "monto" in f]
    categorias = list(dict.fromkeys(f["categoria"] for f in calculadas))
    nombre = lambda c: NOMBRES_CATEGORIA.get(c, c.replace("_", " "))  # noqa: E731
    advertidas = sin_monto = 0
    for n, f in enumerate(con_monto, 1):
        if "monto" in f:
            de = f"de {nombre(f['categoria'])}, " if len(categorias) > 1 else ""
            f["importe"] = f"{cantidad_ar(f['modulos'])} módulos: ${numero_ar(f['monto'])} (módulo {de}vigente desde {f['desde']})"
        elif f["importe"] == ADVERTENCIA:
            f["concepto"], f["importe"] = f"{f['concepto']} (*)", None
            advertidas += 1
        elif ADVERTENCIA in f["importe"]:
            f["importe"] = f["importe"].replace(f"({ADVERTENCIA})", "(*)")
            advertidas += 1
        elif "modulos" in f:
            f["importe"] = f"{cantidad_ar(f['modulos'])} módulos (el valor en pesos no está cargado)"
            sin_monto += 1
        f["concepto"] = f"{n}) {f['concepto']}"
    if advertidas:
        filas.append({"concepto": f"(*) {ADVERTENCIA[:1].upper() + ADVERTENCIA[1:]}.", "importe": None})
    for c in categorias:
        f = next(x for x in calculadas if x["categoria"] == c)
        filas.append({"concepto": f"Montos calculados con el valor del módulo ({nombre(c)}: ${numero_ar(f['valorModulo'])}) vigente desde {f['desde']}, "
                                  f"según el {CODIGO_TARIFARIO}; fuente: portal oficial, consultado el {consulta}.", "importe": None})
    if sin_monto and not categorias:
        filas.append({"concepto": f"Fuente: portal oficial, consultado el {consulta}.", "importe": None})
    return filas


def pesos_en_requisitos(texto, modulo, consulta, avisos, titulo, viejos):
    """Los pesos de una estampilla o un sellado dentro de los requisitos: calculados si el Código
    fija el concepto, con la advertencia si no."""
    if not texto:
        return texto
    salida = []
    for linea in texto.split("\n"):
        if CONTEXTO_DE_PAGO.search(linea) and re.search(r"\$\s?\d", linea):
            hallado = concepto_del_codigo(linea)
            fila = fila_de_modulos(linea, hallado[2], modulo, consulta, avisos, titulo, hallado[0], hallado[1]) if hallado and hallado[2] is not None else {}
            if "monto" in fila:
                viejos.append({"tramite": titulo, "texto": linea, "reemplazo": fila["importe"]})
                linea = re.sub(r"\$\s?\d[\d.,]*\d", lambda _: fila["importe"], linea, count=1)
            else:
                linea = re.sub(r"(\$\s?\d[\d.,]*\d)", lambda m: f"{m.group(1)} ({ADVERTENCIA})", linea, count=1)
        salida.append(linea)
    return "\n".join(salida)


# ---------------------------------------------------------------------------------------------
# Bloques de texto

def _item(li):
    copia = BeautifulSoup(str(li), "html.parser").find("li")
    anidados = [s for s in copia.find_all(["ol", "ul"]) if s.find_parent(["ol", "ul"]) is None]
    extra = []
    for sub in anidados:
        extra += [_limpio(x.get_text(" ")) for x in sub.find_all("li", recursive=False)]
        sub.decompose()
    base = _limpio(copia.get_text(" "))
    return " ".join([base, "; ".join(x for x in extra if x)]).strip()


def lineas_de(nodos):
    """Líneas de texto de una serie de nodos; cada ítem de lista es una línea con "- "."""
    salida = []
    for nodo in nodos:
        if not isinstance(nodo, Tag):
            t = _limpio(str(nodo))
            if t:
                salida.append(t)
            continue
        if "descargas" in (nodo.get("class") or []) or nodo.select_one(".descargas") and not nodo.find(["p", "ol", "ul", "table"]):
            continue
        listas = [nodo] if nodo.name in ("ol", "ul") else []
        if listas:
            salida += [f"- {_item(li)}" for li in nodo.find_all("li", recursive=False) if _item(li)]
        elif nodo.name == "table":
            salida += [f"- {_limpio(tr.get_text(' '))}" for tr in nodo.find_all("tr") if _limpio(tr.get_text(" "))]
        else:
            copia = BeautifulSoup(str(nodo), "html.parser")
            for d in copia.select(".descargas"):
                d.decompose()
            salida += [l for l in texto_multilinea(copia).split("\n") if l.strip()]
    return [l for l in salida if l.strip() and clave(l) not in ("descargar el formulario", "descargar el documento")]


def documentos_de(cuerpo):
    """Adjuntos (PDF, formularios) como enlaces; los que nombran una norma van como norma."""
    formularios, normas, vistos = [], [], set()
    for a in cuerpo.find_all("a", href=True):
        url = url_canonica(a["href"])
        if url in vistos or not DOCUMENTO.search(unquote(urlparse(url).path)):
            continue
        vistos.add(url)
        texto = _limpio(a.get_text(" "))
        if not texto or re.match(r"(?:clic|click|haga|descargar|aqui|ver|link)\b", clave(texto)):
            texto = a.get("title") or re.sub(r"[_-]+", " ", unquote(urlparse(url).path).rsplit("/", 1)[-1].rsplit(".", 1)[0])
        nombre = _limpio(texto)
        destino = normas if re.search(r"(?i)\b(ordenanza|ord\.|decreto|ley|c[óo]digo|resoluci[óo]n|disposici[óo]n)\b", nombre) else formularios
        destino.append({"nombre": nombre, "url": url, "resumen": None})
    return formularios, normas


# ---------------------------------------------------------------------------------------------
# Oficinas

HORARIO = re.compile(r"(?i)^(?:por la (?:mañana|tarde)|de lunes|lunes|de \d|\d{1,2}[:.]\d{2}|mañana|tarde|horarios?\b)")
LUGAR = re.compile(r"(?i)\b(administraci[óo]n|sal[óo]n|direcci[óo]n|centro|intendencia|oficina|mesa de entradas|juzgado|tribunal|delegaci[óo]n|palacio)\b")


def _origen(nombre, domicilio, horario, telefono=None, email=None):
    huella = hashlib.sha1("|".join(clave(x or "") for x in (nombre, domicilio, horario, telefono, email)).encode()).hexdigest()[:8]
    return f"fsatuciudad:{clave(nombre).replace(' ', '-')[:48]}:{huella}"


def oficina_de_encabezado(linea):
    t = re.sub(r"(?i)^se realiza en\s+(?:la|el|los|las)?\s*", "", linea).strip()
    t = re.sub(r"(?i),?\s*en el horario de\s*:?\s*$", "", t).strip(" ,:")
    for patron in (r"(?i)^(.+?)\s+ubicad[oa]s?\s+en\s+(?:calle\s+)?(.+)$",
                   r"^(.+?)\s+((?:[Cc]alle|[Aa]v\.|[Aa]venida)\s+.+|B[°º]\s*.+)$",
                   r"^(.+?)\s+\(([^()]*(?:\d|\bcasi\b|\besq|\sy\s)[^()]*)\)$"):
        m = re.match(patron, t)
        if m:
            return m.group(1).strip(" ,"), m.group(2).strip(" ,.")
    return t, None


def oficinas_de_donde(lineas):
    oficinas, actual = [], None
    for linea in lineas:
        if linea.startswith("- "):
            continue
        if HORARIO.match(linea):
            if actual is not None:
                actual["horario"] = "; ".join(x for x in [actual.get("horario"), linea.rstrip(".")] if x)
            continue
        nombre, domicilio = oficina_de_encabezado(linea)
        if not LUGAR.search(nombre) or len(nombre) > 120:
            actual = None
            continue
        actual = {"nombre": nombre, "domicilio": domicilio}
        oficinas.append(actual)
    for o in oficinas:
        o["localidad"] = LOCALIDAD
        o["origenId"] = _origen(o["nombre"], o.get("domicilio"), o.get("horario"))
    return oficinas


ROTULOS_OFICINA = {"direccion": "domicilio", "domicilio": "domicilio", "contacto": "telefono", "telefono": "telefono", "tel": "telefono", "horario": "horario", "horarios": "horario"}


def oficina_de_rotulos(lineas, nombre):
    """Una oficina con las líneas "Dirección: ...", "Contacto: ...", "Horario: ..." de la ficha."""
    oficina = {"nombre": nombre}
    for linea in lineas:
        m = re.match(r"^([A-Za-zÁÉÍÓÚáéíóúñ ]{3,20})\s*:\s*(.+)$", linea)
        campo = ROTULOS_OFICINA.get(clave(m.group(1))) if m else None
        if campo and campo not in oficina and m.group(2).strip():
            oficina[campo] = m.group(2).strip()
    if "domicilio" not in oficina:
        return []
    oficina["localidad"] = LOCALIDAD
    oficina["origenId"] = _origen(nombre, oficina.get("domicilio"), oficina.get("horario"), oficina.get("telefono"))
    return [oficina]


# ---------------------------------------------------------------------------------------------
# Formatos de ficha

def _es_tema(nodo):
    clases = nodo.get("class") or []
    return nodo.name == "div" and "texto" in clases and "tema" in clases


def _texto_sin_descargas(cuerpo):
    copia = BeautifulSoup(str(cuerpo), "html.parser")
    for d in copia.select(".descargas"):
        d.decompose()
    return _limpio(copia.get_text(" "))


def _es_rotulo_requisitos(p):
    return p.find_parent("table") is None and clave(p.get_text()).startswith("requisitos") and len(_limpio(p.get_text())) <= 40


def detectar_formato(cuerpo):
    """secciones: rótulos div.texto.tema (Descripción, Requisitos, Valor... o las preguntas
    numeradas "1 ¿En qué consiste...?"); tabla: "REQUISITOS" con una tabla de documentación;
    descarga: solo el formulario para bajar; libre: texto con listas o subtítulos sin rótulos."""
    if cuerpo is None:
        return None
    if cuerpo.select("div.texto.tema"):
        return "secciones"
    if cuerpo.select("table td") and any(_es_rotulo_requisitos(p) for p in cuerpo.find_all("p")):
        return "tabla"
    texto = _texto_sin_descargas(cuerpo)
    if cuerpo.select(".descargas a[href]") and len(texto) < 200 and not cuerpo.find(["ol", "ul", "table"]):
        return "descarga"
    if len(texto) >= 200 and (cuerpo.find(["ol", "ul"]) or cuerpo.select("p.bajada")):
        return "libre"
    return None


SECCION = [
    ("descripcion", r"^(?:descripcion|en que consiste)"),
    ("donde", r"^donde"),
    ("requisitos", r"^(?:requisitos|documentacion|que se necesita|listado de documentaciones)"),
    ("costo", r"^(?:valor|que costo|costo)"),
    ("quien", r"^quien puede"),
    ("observaciones", r"^(?:que otro dato|observaciones)"),
]
SIN_DATO = re.compile(r"^(?:ningun[oa]?(?: otr[oa])?|no)?$")


def _rotulo(nodo):
    texto = re.sub(r"^\d+\s*", "", _limpio(nodo.get_text(" "))).strip(" ¿?:")
    k = clave(texto)
    for campo, patron in SECCION:
        if re.search(patron, k):
            return campo, texto
    return "otra", texto


def parsear_secciones(cuerpo):
    partes = {"descripcion": [], "donde": [], "requisitos": [], "costo": [], "quien": [], "observaciones": []}
    otras, actual, nodos = [], None, []

    def cerrar():
        if actual is None:
            return
        campo, titulo = actual
        lineas = lineas_de(nodos)
        if campo == "otra":
            if lineas:
                otras.append({"titulo": titulo, "texto": "\n".join(lineas)})
        elif campo == "requisitos" and partes["requisitos"] and lineas and not lineas[0].startswith("- "):
            partes["requisitos"] += lineas
        else:
            partes[campo] += lineas

    for nodo in cuerpo.children:
        if isinstance(nodo, Tag) and _es_tema(nodo):
            cerrar()
            actual, nodos = _rotulo(nodo), []
        elif actual is not None:
            nodos.append(nodo)
    cerrar()
    observaciones = [l for l in partes["observaciones"] if not SIN_DATO.match(clave(l))]
    secciones = []
    if partes["quien"]:
        secciones.append({"titulo": "Quién puede hacerlo", "texto": "\n".join(partes["quien"])})
    if partes["donde"]:
        secciones.append({"titulo": "Dónde se realiza", "texto": "\n".join(partes["donde"])})
    return {
        "descripcion": "\n".join(partes["descripcion"]) or None,
        "requisitos": "\n".join(partes["requisitos"]) or None,
        "costoLineas": partes["costo"],
        "observaciones": "\n".join(observaciones) or None,
        "secciones": secciones + otras,
        "oficinas": oficinas_de_donde(partes["donde"]),
    }


def parsear_tabla(cuerpo):
    antes, despues, tabla_vista = [], [], False
    requisitos = []
    for nodo in cuerpo.children:
        if not isinstance(nodo, Tag):
            continue
        if nodo.name == "table":
            tabla_vista = True
            requisitos += lineas_de([nodo])
            continue
        if nodo.name == "p" and _es_rotulo_requisitos(nodo):
            continue
        texto = lineas_de([nodo])
        if not texto or (nodo.find("a", href=DOCUMENTO) and len(_limpio(nodo.get_text(" "))) < 120):
            continue
        (despues if tabla_vista else antes).extend(texto)
    secciones = [{"titulo": "Normativa", "texto": "\n".join(antes)}] if antes else []
    return {"descripcion": None, "requisitos": "\n".join(requisitos) or None, "costoLineas": [], "observaciones": "\n".join(despues) or None, "secciones": secciones, "oficinas": []}


def parsear_descarga(cuerpo):
    texto = _texto_sin_descargas(cuerpo)
    return {"descripcion": None, "nota": texto or None, "requisitos": None, "costoLineas": [], "observaciones": None, "secciones": [], "oficinas": []}


ES_COSTO = re.compile(r"(?i)^(?:costo|valor|estampillas?)\b|\bcosto\b.*:")


def parsear_libre(cuerpo, sector, titulo=""):
    lineas = lineas_de(list(cuerpo.children))
    costo, resto, en_costo = [], [], False
    for l in lineas:
        sin_vineta = l.lstrip("- ")
        es_titulo = not l.startswith("- ") and len(l) <= 90 and l.upper() == l and re.search(r"[A-ZÁÉÍÓÚ]{3}", l)
        if es_titulo:
            en_costo = bool(re.search(r"(?i)\bcostos?\b|\bvalor\b", l))
            if en_costo:
                continue
        if en_costo or (not l.startswith("- ") and ES_COSTO.search(sin_vineta) and re.search(r"\$|m[óo]dulo", l, re.I)):
            costo.append(l)
        else:
            resto.append(l)
    pide = clave(titulo).startswith("requisitos") or any(re.match(r"(?:requisitos|documentacion a presentar|listado de documentacion)", clave(l.lstrip("- "))) for l in resto)
    oficinas = oficina_de_rotulos(resto, sector)
    return {
        "descripcion": None,
        "requisitos": "\n".join(resto) if pide else None,
        "costoLineas": costo,
        "observaciones": None,
        "secciones": [] if pide else [{"titulo": "Información del portal", "texto": "\n".join(resto)}],
        "oficinas": oficinas,
    }


PARSERS = {"secciones": parsear_secciones, "tabla": parsear_tabla, "descarga": parsear_descarga}


def parsear_ficha(html, titulo_listado, sector, area, modulo, consulta):
    """(formato, detalle, avisos) o (None, None, motivo) si la ficha no encaja en ningún formato."""
    sopa = BeautifulSoup(html, "html.parser")
    cuerpo = sopa.select_one('[itemprop="articleBody"]')
    titulo_h = sopa.select_one('[itemprop="name"]')
    titulo = sin_mayusculas_sostenidas(_limpio(titulo_h.get_text(" ")) if titulo_h else titulo_listado, titulo_listado)
    descartes = []
    if cuerpo is not None:
        preparar_cuerpo(cuerpo, descartes)
    formato = detectar_formato(cuerpo)
    if formato is None:
        return None, None, {"motivo": "la ficha no tiene ninguno de los formatos conocidos" if cuerpo is not None else "la página no tiene el cuerpo del artículo"}
    datos = parsear_libre(cuerpo, sector, titulo) if formato == "libre" else PARSERS[formato](cuerpo)
    formularios, normas = documentos_de(cuerpo)
    avisos_modulo, viejos = [], []
    costos = costos_de(datos["costoLineas"], modulo, consulta, avisos_modulo, titulo, viejos)

    secciones = list(datos["secciones"])
    if area:
        secciones.insert(0, {"titulo": "Área", "texto": f"{area} ({sector})"})
    descripcion = datos["descripcion"] or " ".join(
        x for x in [f"{titulo} ({sector}, {RAIZ['nombre']}).", datos.get("nota")] if x)

    requisitos = datos["requisitos"]
    if requisitos and requisitos.count("\n- ") == 0 and requisitos.startswith("- "):
        requisitos = requisitos[2:]
    requisitos = pesos_en_requisitos(requisitos, modulo, consulta, avisos_modulo, titulo, viejos)

    limpio = lambda t: sin_datos_personales(t, descartes)  # noqa: E731
    detalle = {
        "titulo": limpio(titulo),
        "descripcion": limpio(descripcion),
        "requisitos": limpio(requisitos),
        "observaciones": limpio(datos["observaciones"]),
        "secciones": [{"titulo": s["titulo"], "texto": limpio(s["texto"])} for s in secciones if s["texto"]],
        "modalidad": [], "duracion": None, "destinatarios": [], "pasoAPaso": None,
        "organismo": {"id": None, "nombre": sector},
        "costos": [{**c, "concepto": limpio(c["concepto"]), "importe": c["importe"]} for c in costos],
        "oficinas": [{k: (limpio(v) if isinstance(v, str) and k != "origenId" else v) for k, v in o.items()} for o in datos["oficinas"]],
        "formularios": formularios,
        "normas": normas,
    }
    for o in detalle["oficinas"]:
        if o.get("email") and not es_institucional(o["email"]):
            descartes.append({"tipo": "correo no institucional", "valor": enmascarar(o.pop("email"))})
        if o.get("telefono") and SIN_TELEFONO in o["telefono"]:
            o.pop("telefono")
    return formato, detalle, {"modulos": avisos_modulo, "pesosViejos": viejos, "descartes": descartes}


# ---------------------------------------------------------------------------------------------
# Recorrido


def _fecha_de_cache(cliente, clave_cache, extension="html"):
    ruta = cliente._ruta_cache(clave_cache, extension)
    if ruta.exists():
        return datetime.fromtimestamp(ruta.stat().st_mtime, timezone.utc)
    return datetime.now(timezone.utc)


def leer_modulo(cliente, hoy, usar_cache, log=print):
    try:
        pagina = cliente.get_html(PAGINA_MODULO, clave="codigo_tarifario", usar_cache=usar_cache, codificacion="utf-8")
    except ErrorDeSitio as e:
        return {"legible": False, "motivo": f"no se pudo leer la página del código tarifario ({e})", "fuente": PAGINA_MODULO}
    sopa = BeautifulSoup(pagina, "html.parser")
    enlace = next((a for a in sopa.find_all("a", href=True)
                   if re.search(r"valor del modulo desde", clave(a.get_text(" "))) and DOCUMENTO.search(a["href"])), None)
    if enlace is None:
        return {"legible": False, "motivo": "la página del código tarifario no enlaza la tabla del valor del módulo", "fuente": PAGINA_MODULO}
    url = url_canonica(enlace["href"])
    nombre = "modulo_" + clave(unquote(urlparse(url).path).rsplit("/", 1)[-1]).replace(" ", "_")
    try:
        contenido = cliente.get_bytes(url, clave=nombre, usar_cache=usar_cache, extension="pdf")
        texto = texto_de_pdf(contenido)
    except Exception as e:  # noqa: BLE001 - un PDF dañado también es "ilegible"
        return {"legible": False, "motivo": f"no se pudo leer el PDF ({e})", "fuente": url}
    resultado = leer_tabla_modulo(texto, hoy)
    resultado["fuente"] = url
    resultado["titulo"] = _limpio(enlace.get_text(" "))
    log(f"Valor del módulo: {'legible' if resultado['legible'] else 'ilegible'} ({resultado.get('motivo') or 'completo'})")
    return resultado


def read(cache_dir="data/raw/municipal", refrescar=False, verificar=True, cliente=None, hoy=None, muestra=None, log=print):
    cliente = cliente or Cliente(cache_dir)
    hoy = hoy or date.today()
    consulta = hoy.strftime("%d/%m/%Y")
    usar_cache = not refrescar
    capturado = datetime.now(timezone.utc).isoformat(timespec="seconds")

    log("Leyendo el listado de trámites...")
    fichas, otros = parsear_listado(cliente.get_html(LISTADO, clave="tramites", usar_cache=usar_cache, codificacion="utf-8"))
    modulo = leer_modulo(cliente, hoy, usar_cache, log)
    if muestra:
        fichas = fichas[:muestra]

    avisos_sector, tramites, no_reconocidas, errores = [], [], [], []
    informe = {"formatos": {}, "modulos": [], "pesosViejos": [], "descartes": []}
    ubicaciones = []
    log(f"Bajando {len(fichas)} fichas...")
    for n, f in enumerate(fichas, 1):
        sector, padre, area = ubicar(f, avisos_sector)
        clave_cache = "ficha_" + f["ruta"].strip("/")
        try:
            html = cliente.get_html(f["url"], clave=clave_cache, usar_cache=usar_cache, codificacion="utf-8")
        except ErrorDeSitio as e:
            errores.append({"url": f["url"], "titulo": f["titulo"], "motivo": str(e)})
            continue
        formato, detalle, extra = parsear_ficha(html, f["titulo"], sector, area, modulo, consulta)
        if formato is None:
            no_reconocidas.append({"url": f["url"], "titulo": f["titulo"], "motivo": extra["motivo"]})
            continue
        ubicaciones.append((sector, padre, area))
        informe["formatos"].setdefault(formato, []).append(f["url"])
        for k in ("modulos", "pesosViejos", "descartes"):
            informe[k] += [{**x, "url": f["url"]} for x in extra[k]]
        detalle["verificadoEn"] = _fecha_de_cache(cliente, clave_cache).isoformat(timespec="seconds")
        detalle["formato"] = formato
        tramites.append({
            "nombre": detalle["titulo"],
            "descripcion": detalle["descripcion"],
            "sector": sector,
            "sectorPadre": padre,
            "fuenteUrl": f["url"],
            "detalle": detalle,
        })
        if n % 20 == 0:
            log(f"  {n}/{len(fichas)}")

    enlaces = {}
    if verificar:
        urls = [d["url"] for t in tramites for d in t["detalle"]["formularios"] + t["detalle"]["normas"]]
        log(f"Verificando {len(set(urls))} adjuntos (HEAD)...")
        enlaces = verificar_enlaces(cliente, urls, cache_dir, log)
        for t in tramites:
            for d in t["detalle"]["formularios"] + t["detalle"]["normas"]:
                d["enlace"] = enlaces.get(d["url"], {"estado": "sin verificar"})

    return {
        "fuente": FUENTE,
        "capturadoEn": capturado,
        "consultadoEl": consulta,
        "parcial": bool(muestra),
        "modulo": modulo,
        "sectores": armar_sectores(ubicaciones),
        "tramites": tramites,
        "noReconocidas": no_reconocidas,
        "errores": errores,
        "noFichas": otros,
        "avisos": avisos_sector,
        "informe": {**informe, "enlaces": enlaces, "pedidos": cliente.pedidos, "desdeCache": cliente.desde_cache},
    }
