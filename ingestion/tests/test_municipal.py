"""Tests del scraper municipal (formosatuciudad.gob.ar) con HTML de ejemplo, sin red."""

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from bs4 import BeautifulSoup  # noqa: E402

from sources import municipal as m  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "municipal"
HOY = date(2026, 11, 6)
CONSULTA = "06/11/2026"


def fixture(nombre):
    return (FIXTURES / nombre).read_text(encoding="utf-8")


MODULO = m.leer_tabla_modulo(fixture("modulo.txt"), HOY)


def ficha(nombre, sector="Administración de Ingresos Municipales (AIM)", area=None, modulo=MODULO):
    return m.parsear_ficha(fixture(nombre), "listado", sector, area, modulo, CONSULTA)


def cuerpo(nombre):
    return BeautifulSoup(fixture(nombre), "html.parser").select_one('[itemprop="articleBody"]')


class Listado(unittest.TestCase):
    def setUp(self):
        self.fichas, self.otros = m.parsear_listado(fixture("listado.html"))

    def test_solo_las_fichas_de_un_segmento(self):
        rutas = [f["ruta"] for f in self.fichas]
        self.assertEqual(rutas, ["/lugares-de-atencion-y-pagos-habilitados", "/cambio-de-titularidad",
                                 "/alta-de-automotor-0km-–-radicación-del-automotor", "/documentacion-a-presentar-para-obra-nueva",
                                 "/requisitos-para-afectar-remises"])
        motivos = {o["texto"]: o["motivo"] for o in self.otros}
        self.assertIn("otra sección", motivos["CALENDARIO"])
        self.assertIn("documento suelto", motivos["CÓDIGO DE EDIFICACIÓN"])
        self.assertIn("otra sección", motivos["Boleto Estudiantil"])
        self.assertEqual(motivos["Instagram"], "enlace a otro sitio")

    def test_url_canonica_codifica_los_acentos(self):
        alta = self.fichas[2]["url"]
        self.assertTrue(alta.startswith("https://formosatuciudad.gob.ar/alta-de-automotor-0km-%E2%80%93-radicaci%C3%B3n"))

    def test_sectores_con_padre_y_area(self):
        avisos = []
        ubic = [m.ubicar(f, avisos) for f in self.fichas]
        self.assertEqual(ubic[0], ("Municipalidad de la Ciudad de Formosa", None, None))
        self.assertEqual(ubic[1], ("Administración de Ingresos Municipales (AIM)", "Municipalidad de la Ciudad de Formosa", "Área de Automotor"))
        self.assertEqual(ubic[3], ("Dirección de Obras Privadas", "Secretaría de Obras Públicas", None))
        sectores = m.armar_sectores(ubic)
        self.assertEqual(sectores[0], m.RAIZ)
        obras = next(s for s in sectores if s["nombre"] == "Secretaría de Obras Públicas")
        self.assertEqual((obras["padre"], obras["jurisdiccion"], obras["localidad"]), ("Municipalidad de la Ciudad de Formosa", None, None))
        self.assertEqual(len(sectores), len({s["nombre"] for s in sectores}))
        self.assertEqual(avisos, [])


class Formatos(unittest.TestCase):
    def test_deteccion(self):
        esperado = {"secciones.html": "secciones", "preguntas.html": "secciones", "tabla.html": "tabla",
                    "descarga.html": "descarga", "libre.html": "libre", "no_reconocida.html": None}
        for archivo, formato in esperado.items():
            c = cuerpo(archivo)
            m.preparar_cuerpo(c, [])
            self.assertEqual(m.detectar_formato(c), formato, archivo)

    def test_secciones_con_rotulos(self):
        formato, d, extra = ficha("secciones.html")
        self.assertEqual(formato, "secciones")
        self.assertEqual(d["titulo"], "Trámite de Exención de Tasa Única para Jubilados")
        self.assertTrue(d["descripcion"].startswith("Este trámite se realiza para solicitar la exención de la Tasa Única"))
        self.assertEqual(d["requisitos"].split("\n"), ["- Fotocopia del D.N.I.", "- Recibo de Haberes.", "- Certificado de Supervivencia."])
        dondes = [s for s in d["secciones"] if s["titulo"] == "Dónde se realiza"]
        self.assertIn("Calle San Martin 743", dondes[0]["texto"])
        self.assertEqual([(o["nombre"], o["domicilio"]) for o in d["oficinas"]], [("Intendencia (Mesa de Entradas General)", "Calle San Martin 743")])
        self.assertEqual(d["oficinas"][0]["localidad"], "Formosa")
        self.assertTrue(d["oficinas"][0]["origenId"].startswith("fsatuciudad:intendencia-mesa-de-entradas-general:"))

    def test_secciones_con_preguntas_numeradas(self):
        formato, d, _ = ficha("preguntas.html", area="Área de Automotor")
        self.assertEqual(formato, "secciones")
        self.assertEqual(d["descripcion"], "Actualización de los datos de la titularidad del vehículo.")
        self.assertEqual(d["requisitos"], "- Fotocopia del Título del Automotor\n- Fotocopia del DNI.")
        self.assertIsNone(d["observaciones"])
        titulos = [s["titulo"] for s in d["secciones"]]
        self.assertEqual(titulos, ["Área", "Quién puede hacerlo", "Dónde se realiza"])
        self.assertEqual([(o["nombre"], o["domicilio"], o.get("horario")) for o in d["oficinas"]], [
            ("Administración de Ingresos Municipales (AIM)", "Fotheringham Nº 1364", "por la mañana 07:30 hs. a 12:30 hs"),
            ("Direccion de Transito", "Pringles casi Rivadavia", "por la mañana 08:00 hs. a 12:00 hs"),
        ])
        self.assertEqual(d["costos"], [{"concepto": "El trámite no tiene costo alguno.", "importe": "$ 0"}])

    def test_tabla(self):
        formato, d, _ = ficha("tabla.html", sector="Dirección de Obras Privadas")
        self.assertEqual(formato, "tabla")
        self.assertEqual(d["titulo"], "Documentación a presentar para obra nueva plan procrear")
        self.assertEqual(len(d["requisitos"].split("\n")), 3)
        self.assertTrue(d["requisitos"].startswith("- Formulario 1 (Solicitud de permiso de construcción)"))
        self.assertEqual(d["secciones"], [{"titulo": "Normativa", "texto": "Según art. 20° ordenanza 7708/22"}])
        self.assertEqual([f["url"] for f in d["formularios"]], ["https://formosatuciudad.gob.ar/archivos/Obras_Privadas/FORMULARIO%201.pdf"])
        self.assertIn("Dirección de Obras Privadas", d["descripcion"])

    def test_descarga(self):
        formato, d, _ = ficha("descarga.html", sector="Dirección de Catastro y Tierras Fiscales")
        self.assertEqual(formato, "descarga")
        self.assertEqual(d["formularios"], [{"nombre": "Pedido de Línea", "url": "https://formosatuciudad.gob.ar/archivos/Catastro/Pedido%20de%20L%C3%ADnea.doc", "resumen": None}])
        self.assertIsNone(d["requisitos"])
        self.assertEqual(d["descripcion"], "Pedido de Línea (Dirección de Catastro y Tierras Fiscales, Municipalidad de la Ciudad de Formosa).")

    def test_libre(self):
        formato, d, _ = ficha("libre.html", sector="Tránsito, Transporte y Emergencia")
        self.assertEqual(formato, "libre")
        self.assertIn("- Título de propiedad o cédula del automotor Original.; Fotocopia.", d["requisitos"])
        self.assertEqual(d["costos"], [{"concepto": "Costo del trámite por primera vez", "importe": "$ 6.247,12"}])
        self.assertEqual(d["oficinas"][0]["domicilio"], "Rivadavia 546 - Planta baja")
        self.assertEqual(d["oficinas"][0]["telefono"], "3704-012377")

    def test_no_reconocida(self):
        formato, d, extra = ficha("no_reconocida.html")
        self.assertIsNone(formato)
        self.assertIsNone(d)
        self.assertIn("ninguno de los formatos", extra["motivo"])


class Modulo(unittest.TestCase):
    def test_lee_el_valor_vigente(self):
        self.assertTrue(MODULO["legible"])
        self.assertEqual(MODULO["desde"], ["01/08/2026", "01/09/2026", "01/10/2026"])
        self.assertEqual(MODULO["vigente"], {"desde": "01/10/2026", "indice": 2})
        self.assertEqual(MODULO["categorias"]["servicios_varios"], [929.26, 968.30, 1007.35])
        self.assertEqual(m.valor_modulo(MODULO, "habilitaciones"), (5036.76, "01/10/2026"))

    def test_vigencia_segun_la_fecha_de_consulta(self):
        septiembre = m.leer_tabla_modulo(fixture("modulo.txt"), date(2026, 9, 15))
        self.assertEqual(m.valor_modulo(septiembre, "servicios_varios"), (968.30, "01/09/2026"))
        antes = m.leer_tabla_modulo(fixture("modulo.txt"), date(2026, 7, 1))
        self.assertFalse(antes["legible"])

    def test_calcula_el_monto_y_lo_escribe(self):
        _, d, extra = ficha("secciones.html")
        exencion = d["costos"][0]
        self.assertEqual(exencion["concepto"], "Por solicitud de acogimiento y/o renovación de exención de Tributos Municipales")
        self.assertEqual(exencion["importe"], "2,5 módulos ($2.518,38, con módulo a $1.007,35 vigente desde el 01/10/2026; según el portal oficial, consultado el 06/11/2026)")

    def test_concepto_sin_categoria_queda_solo_con_la_cantidad(self):
        _, d, extra = ficha("secciones.html")
        plan = d["costos"][1]
        self.assertEqual(plan["importe"], "3 módulos (según el portal oficial, consultado el 06/11/2026; el valor del módulo en pesos no está cargado)")
        self.assertNotIn("$", plan["importe"])
        self.assertEqual(extra["modulos"][0]["motivo"], "el concepto no está en la tabla de conceptos del Código Tarifario")

    def test_valor_ilegible_no_inventa_el_monto(self):
        for texto in ["", "Valor de los Modulos 01/10/2026: 05% Contribución por servicios varios ilegible", "sin fechas 929.26 968.30"]:
            ilegible = m.leer_tabla_modulo(texto, HOY)
            self.assertFalse(ilegible["legible"], texto)
            _, d, extra = ficha("secciones.html", modulo=ilegible)
            self.assertNotIn("$", d["costos"][0]["importe"])
            self.assertTrue(d["costos"][0]["importe"].startswith("2,5 módulos ("))
            self.assertEqual(extra["modulos"][0]["motivo"], "no se pudo leer el valor del módulo")

    def test_valores_que_bajan_no_son_legibles(self):
        raro = fixture("modulo.txt").replace("1007.35", "907.35")
        r = m.leer_tabla_modulo(raro, HOY)
        self.assertNotIn("servicios_varios", r["categorias"])
        self.assertIsNone(m.valor_modulo(r, "servicios_varios"))

    def test_conceptos_del_codigo_tarifario(self):
        self.assertEqual(m.categoria_de("Certificados de Libre Deuda")[0], "servicios_varios")
        self.assertEqual(m.categoria_de("Según dimensiones del local a habilitar (hasta 25 m 2)")[0], "habilitaciones")
        self.assertEqual(m.categoria_de("Plan de Pago en cuotas"), (None, None))


class Privacidad(unittest.TestCase):
    def setUp(self):
        _, self.d, self.extra = ficha("libre.html", sector="Tránsito, Transporte y Emergencia")
        self.todo = repr(self.d)

    def test_sin_nombres_de_personas(self):
        self.assertNotIn("Pérez", self.todo)
        self.assertNotIn("Juan Carlos", self.todo)
        self.assertNotIn("Ana Gómez", self.todo)
        self.assertIn("Director de Tránsito", self.todo)
        self.assertIn("Sr. Intendente", self.todo)

    def test_solo_correos_institucionales(self):
        self.assertNotIn("gmail", self.todo)
        self.assertIn("transito@formosatuciudad.gob.ar", self.todo)
        self.assertIn(m.SIN_CORREO, self.todo)
        tipos = sorted(x["tipo"] for x in self.extra["descartes"])
        self.assertEqual(tipos, ["correo no institucional", "nombre de persona", "responsable"])

    def test_el_informe_de_descartes_tampoco_los_guarda(self):
        valores = repr(self.extra["descartes"])
        for dato in ("Pérez", "Juan Carlos", "Ana Gómez", "transito@gmail"):
            self.assertNotIn(dato, valores)
        self.assertIn("***@gmail.com", valores)
        self.assertIn("Lic. ***", valores)

    def test_texto_suelto(self):
        descartes = []
        t = m.sin_datos_personales("Consultas a juana.perez@hotmail.com o a mesa@formosa.gob.ar, Arq. Gómez Ruiz atiende.", descartes)
        self.assertEqual(t, f"Consultas a {m.SIN_CORREO} o a mesa@formosa.gob.ar, atiende.")
        self.assertEqual(len(descartes), 2)


if __name__ == "__main__":
    unittest.main()
