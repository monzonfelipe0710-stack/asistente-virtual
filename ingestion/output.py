import json
from pathlib import Path

def write_json(data, path):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Escrito {path} — Sectores: {len(data['sectores'])} | Trámites: {len(data['tramites'])}")