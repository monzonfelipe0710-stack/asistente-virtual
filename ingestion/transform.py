import re
import unicodedata


def clave_nombre(nombre):
    """Para comparar nombres de organismos: sin tildes, minúsculas y solo letras y números."""
    sin_tildes = unicodedata.normalize("NFD", nombre or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", sin_tildes.lower()).strip()


def normalize(records, organismos_del_sitio=None):
    """Dedup de organismos y trámites; arma el modelo común {sectores, tramites}.

    Con `organismos_del_sitio` (el recorrido del listado de detalle_html) cada trámite lleva
    además `enListado` y `organismoIndexado`, y la ficha en `detalle` si se pudo leer."""
    names = sorted({r["organismo"] for r in records if r["organismo"]})
    sectores = [{"nombre": n, "tipo": "ORGANISMO"} for n in names]
    indexados = {clave_nombre(o["nombre"]) for o in organismos_del_sitio or []}

    seen, tramites = set(), []
    for r in records:
        key = r["url"] or r["titulo"]
        if not r["titulo"] or not r["organismo"] or key in seen:
            continue
        seen.add(key)
        tramite = {
            "nombre": r["titulo"],
            "descripcion": r["descripcion"],
            "sector": r["organismo"],
            "fuenteUrl": r["url"],
        }
        if organismos_del_sitio is not None:
            tramite["enListado"] = r.get("enListado", False)
            tramite["organismoIndexado"] = clave_nombre(r["organismo"]) in indexados
            if r.get("detalle"):
                tramite["detalle"] = r["detalle"]
            if r.get("error"):
                tramite["errorFicha"] = r["error"]
        tramites.append(tramite)
    return {"sectores": sectores, "tramites": tramites}
