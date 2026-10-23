def normalize(records):
    """Dedup de organismos y trámites; arma el modelo común {sectores, tramites}."""
    names = sorted({r["organismo"] for r in records if r["organismo"]})
    sectores = [{"nombre": n, "tipo": "ORGANISMO"} for n in names]

    seen, tramites = set(), []
    for r in records:
        key = r["url"] or r["titulo"]
        if not r["titulo"] or not r["organismo"] or key in seen:
            continue
        seen.add(key)
        tramites.append({
            "nombre": r["titulo"],
            "descripcion": r["descripcion"],
            "sector": r["organismo"],
            "fuenteUrl": r["url"],
        })
    return {"sectores": sectores, "tramites": tramites}