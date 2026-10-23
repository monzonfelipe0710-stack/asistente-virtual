import re
import xml.etree.ElementTree as ET

def _clean(text):
    if text is None:
        return ""
    return re.sub(r"\s+", " ", text).strip()

def read(path):
    """Lee el catálogo XML del portal. ET.parse respeta la codificación
    declarada en el <?xml ... ?> (acá ISO-8859-1), así que los acentos salen bien."""
    tree = ET.parse(path)
    root = tree.getroot()

    records = []
    for it in root.findall("Tramites"):
        records.append({
            "titulo": _clean(it.findtext("Titulo")),
            "organismo": _clean(it.findtext("Organismo")),
            "descripcion": _clean(it.findtext("Descripcion")),
            "url": _clean(it.findtext("URL")) or _clean(it.findtext("Path")),
        })
    return records