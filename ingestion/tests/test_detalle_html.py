"""Tests del parseo de las fichas, con HTML armado a mano (sin red)."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sources import detalle_html as d  # noqa: E402

FICHA = """
<html><body><section id="main"><div id="content">
<div class="title-box"><h2 class="title">Pasaporte</h2></div>
<div class="tab-content">
 <div class="tab-pane" id="detalle">
  <div class="bs-callout"><h3>Descripción</h3><p>Documento de viaje.<br/><br/>Validez internacional.</p></div>
  <div class="bs-callout"><h4>Requisitos</h4><p>Para mayores de edad:<br/>* DNI actualizado.<br/>Para menores de edad:<br/>* DNI.<br/>* Partida de nacimiento.</p></div>
  <div class="bs-callout"><h4>Observaciones</h4><p>Se entrega en 15 días.</p></div>
 </div>
 <div class="tab-pane" id="formularios"><table>
  <tr><td></td><td><a href="https://archivos.formosa.gob.ar/f/form_1.pdf">Formulario 1</a></td></tr>
 </table></div>
 <div class="tab-pane" id="cuanto"><table>
  <tr><td>PASAPORTE</td><td>$ 35000</td></tr>
 </table></div>
 <div class="tab-pane" id="donde"><div id="accordion_ofi">
  <div class="panel"><div class="panel-heading"><a href="#collapse_1051">CDR - Oficina: Sarmiento 968</a></div>
   <div class="panel-collapse collapse" id="collapse_1051"><table>
    <tr><td>Domicilio:</td><td>Sarmiento 968</td></tr>
    <tr><td>Teléfono:</td><td>(0370) 442-0000</td></tr>
    <tr><td>E-mail:</td><td>cdr@formosa.gob.ar</td></tr>
    <tr><td>Responsable:</td><td>Persona Ficticia</td></tr>
    <tr><td>Horario de Atención:</td><td>Lunes a Viernes de 7 a 12</td></tr>
   </table></div></div>
 </div></div>
 <div class="tab-pane" id="normas"><table>
  <tr><td><strong>Resolución 1474/2012</strong></td></tr>
  <tr><td>Características<br/><a href="https://archivos.formosa.gob.ar/n/norma_150.pdf">Descargar Texto Completo de la Norma ()</a></td></tr>
  <tr><td><strong>Ley 462/84</strong></td></tr>
  <tr><td>Texto de la Norma No Disponible</td></tr>
 </table></div>
</div>
<div class="col-sm-6">
 <div class="header-box"><div class="icon-box"><i class="fa fa-inbox"></i></div><div>¿Cómo se realiza el trámite?:</div><p><strong>Personal</strong></p></div>
 <div class="header-box"><div class="icon-box"><i class="fa fa-clock"></i></div><div>Duración Aproximada:</div><h6>8 minutos</h6></div>
 <div class="header-box"><div>Organismo Responsable</div><h6><a href="/tramites/organismo/823/registro_civil">Dirección del Registro Civil</a></h6></div>
 <div class="steps"><p>1. Pedir turno.</p><p>2. Presentarse.</p></div>
</div>
</div></section></body></html>
"""

ERROR = """<html><body><section id="main"><h1>404</h1><p>Trámite no encontrado.</p>
<p>Ha ocurrido un error!</p></section></body></html>"""

LISTADO = """<html><body><section id="main">
<a href="/tramite/159/matrimonio">Matrimonio</a>
<a href="/tramite/171/pasaporte">Pasaporte</a>
<a href="/tramite/171/pasaporte">Pasaporte (repetido)</a>
<ul class="pagination"><li><a href="/tramites/buscar/pagina/1">1</a></li>
<li><a aria-label="Siguiente" href="/tramites/buscar/pagina/3"></a></li></ul>
</section></body></html>"""

ORGANISMOS = """<html><body><section id="main"><div class="row">
<div><a class="work" href="/tramites/organismo/762/policia"><div class="work-title">
<h3 class="title">Policía de la Provincia</h3><div class="description">Ministerio de Gobierno</div></div></a></div>
<div><a class="work" href="/tramites/organismo/876/atp"><div class="work-title">
<h3 class="title">Administración Tributaria</h3><div class="description">Dependiente del Poder Ejecutivo</div></div></a></div>
</div></section></body></html>"""


class ParseoTest(unittest.TestCase):
    def test_ficha_completa(self):
        f = d.parsear_ficha(FICHA)
        self.assertEqual(f["titulo"], "Pasaporte")
        self.assertEqual(f["descripcion"], "Documento de viaje.\n\nValidez internacional.")
        self.assertIn("Para menores de edad:\n* DNI.\n* Partida de nacimiento.", f["requisitos"])
        self.assertEqual(f["observaciones"], "Se entrega en 15 días.")
        self.assertEqual(f["modalidad"], ["Personal"])
        self.assertEqual(f["duracion"], "8 minutos")
        self.assertEqual(f["pasoAPaso"], "1. Pedir turno.\n\n2. Presentarse.")
        self.assertEqual(f["organismo"], {"id": 823, "nombre": "Dirección del Registro Civil"})
        self.assertEqual(f["costos"], [{"concepto": "PASAPORTE", "importe": "$ 35000"}])

    def test_oficina_sin_responsable(self):
        [o] = d.parsear_ficha(FICHA)["oficinas"]
        self.assertEqual(o["origenId"], "collapse_1051")
        self.assertEqual(o["domicilio"], "Sarmiento 968")
        self.assertEqual(o["telefono"], "(0370) 442-0000")
        self.assertEqual(o["email"], "cdr@formosa.gob.ar")
        self.assertEqual(o["horario"], "Lunes a Viernes de 7 a 12")
        self.assertNotIn("Persona Ficticia", str(o))

    def test_formularios_y_normas(self):
        f = d.parsear_ficha(FICHA)
        self.assertEqual(f["formularios"], [{"nombre": "Formulario 1", "url": "https://archivos.formosa.gob.ar/f/form_1.pdf", "resumen": None}])
        self.assertEqual(f["normas"][0], {"nombre": "Resolución 1474/2012", "url": "https://archivos.formosa.gob.ar/n/norma_150.pdf", "resumen": "Características"})
        self.assertEqual(f["normas"][1], {"nombre": "Ley 462/84", "url": None, "resumen": None})

    def test_pagina_de_error_con_200(self):
        self.assertTrue(d.es_pagina_de_error(ERROR))
        self.assertFalse(d.es_pagina_de_error(FICHA))

    def test_listado_y_paginacion(self):
        ids, siguiente = d.parsear_pagina_listado(LISTADO)
        self.assertEqual(ids, [159, 171])
        self.assertEqual(siguiente, "https://www.formosa.gob.ar/tramites/buscar/pagina/3")
        self.assertEqual(d.parsear_pagina_listado("<section id='main'></section>"), ([], None))

    def test_organismos_con_ministerio(self):
        orgs = d.parsear_organismos(ORGANISMOS)
        self.assertEqual([(o["id"], o["nombre"], o["ministerio"]) for o in orgs], [
            (762, "Policía de la Provincia", "Ministerio de Gobierno"),
            (876, "Administración Tributaria", "Dependiente del Poder Ejecutivo"),
        ])

    def test_decodifica_iso_8859_1_con_caracteres_de_windows(self):
        self.assertEqual(d.decodificar(b"Tr\xe1mite \x93Express\x94"), "Trámite “Express”")
        self.assertEqual(d.decodificar("Dirección".encode("iso-8859-1")), "Dirección")

    def test_id_de_url(self):
        self.assertEqual(d.id_de_url("http://www.formosa.gob.ar/tramite/171/detalle_del_tramite"), 171)
        self.assertIsNone(d.id_de_url("http://www.formosa.gob.ar/tramites"))


class FalsaRespuesta:
    def __init__(self, status=200, contenido=b"", headers=None, texto=""):
        self.status_code = status
        self.content = contenido
        self.headers = headers or {}
        self.text = texto

    def close(self):
        pass


class FalsaSesion:
    def __init__(self, robots="User-agent: *\nDisallow: /privado/\n"):
        self.headers = {}
        self.pedidos = []
        self.robots = robots

    def get(self, url, timeout=None):
        self.pedidos.append(("GET", url))
        return FalsaRespuesta(texto=self.robots)

    def request(self, metodo, url, **kw):
        self.pedidos.append((metodo, url))
        return FalsaRespuesta(contenido="<html>ok</html>".encode("iso-8859-1"), headers={"Content-Type": "application/pdf"})


class ClienteTest(unittest.TestCase):
    def setUp(self):
        import tempfile

        self.dir = tempfile.mkdtemp()
        self.esperas = []
        self.ahora = [0.0]
        self.sesion = FalsaSesion()
        self.cliente = d.Cliente(self.dir, sesion=self.sesion, dormir=self.esperas.append, reloj=lambda: self.ahora[0])

    def test_un_pedido_por_segundo_y_user_agent(self):
        self.cliente.get_html("https://www.formosa.gob.ar/a")
        self.cliente.get_html("https://www.formosa.gob.ar/b")
        self.assertIn("ChatAP", self.sesion.headers["User-Agent"])
        self.assertIn("IPF", self.sesion.headers["User-Agent"])
        # robots.txt, /a y /b: cada pedido después del primero espera el segundo completo.
        self.assertEqual(self.esperas, [1.0, 1.0])

    def test_respeta_robots(self):
        with self.assertRaises(d.ErrorDeSitio):
            self.cliente.get_html("https://www.formosa.gob.ar/privado/x")
        self.assertNotIn(("GET", "https://www.formosa.gob.ar/privado/x"), self.sesion.pedidos)

    def test_cache_reanuda_sin_pedir(self):
        self.cliente.get_html("https://www.formosa.gob.ar/tramite/1/detalle_del_tramite", clave="tramite_1")
        antes = len(self.sesion.pedidos)
        self.cliente.get_html("https://www.formosa.gob.ar/tramite/1/detalle_del_tramite", clave="tramite_1")
        self.assertEqual(len(self.sesion.pedidos), antes)
        self.assertEqual(self.cliente.desde_cache, 1)

    def test_head_no_descarga(self):
        codigo, tipo = self.cliente.head("https://archivos.formosa.gob.ar/n/norma_150.pdf")
        self.assertEqual((codigo, tipo), (200, "application/pdf"))
        self.assertIn(("HEAD", "https://archivos.formosa.gob.ar/n/norma_150.pdf"), self.sesion.pedidos)


if __name__ == "__main__":
    unittest.main()
