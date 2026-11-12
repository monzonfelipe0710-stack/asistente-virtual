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
        self.assertEqual(d["costos"], [{"concepto": "Costo del trámite por primera vez", "importe": f"$ 6.247,12 ({m.ADVERTENCIA})"}])
        self.assertEqual(d["oficinas"][0]["domicilio"], "Rivadavia 546 - Planta baja")
        self.assertNotIn("telefono", d["oficinas"][0])

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

    def test_un_solo_monto_lleva_el_calculo_en_la_misma_linea(self):
        filas = m.costos_de(["Por solicitud de acogimiento y/o renovación de exención de Tributos Municipales: 2.5 Módulos"], MODULO, CONSULTA, [], "Exención", [])
        self.assertEqual(filas, [{**filas[0], "concepto": "Por solicitud de acogimiento y/o renovación de exención de Tributos Municipales",
                                  "importe": "2,5 módulos: $2.518,38, calculado con el valor del módulo (servicios varios: $1.007,35) vigente desde 01/10/2026, según el Código Tarifario 2026; fuente: portal oficial, consultado el 06/11/2026"}])

    def test_varios_montos_van_numerados_con_el_origen_al_pie(self):
        _, d, extra = ficha("secciones.html")
        texto = [c["concepto"] + (f": {c['importe']}" if c["importe"] else "") for c in d["costos"]]
        self.assertEqual(texto, ([
            "1) Por solicitud de acogimiento y/o renovación de exención de Tributos Municipales: 2,5 módulos: $2.518,38 (módulo vigente desde 01/10/2026)",
            "2) Plan de Pago en cuotas: 3 módulos (el valor en pesos no está cargado)",
            "Montos calculados con el valor del módulo (servicios varios: $1.007,35) vigente desde 01/10/2026, según el Código Tarifario 2026; fuente: portal oficial, consultado el 06/11/2026.",
        ]))
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


class PesosDelPortal(unittest.TestCase):
    def costos(self, lineas, titulo="Trámite"):
        avisos, viejos = [], []
        return m.costos_de(lineas, MODULO, CONSULTA, avisos, titulo, viejos), viejos

    def test_pesos_con_concepto_del_codigo_se_recalculan(self):
        filas, viejos = self.costos(["$125 Libre deuda emitida por Administración de Ingresos Municipales (AIM)", "$85 Libre deuda emitida por Tribunal de Faltas", "$68 Libre deuda emitida por Direccion de Transito"])
        self.assertEqual([(f["concepto"], f["importe"]) for f in filas], [
            ("1) Libre deuda emitida por Administración de Ingresos Municipales (AIM)", "4 módulos: $4.029,40 (módulo vigente desde 01/10/2026)"),
            ("2) Libre deuda emitida por Tribunal de Faltas", "$ 85 (*)"),
            ("3) Libre deuda emitida por Direccion de Transito", "$ 68 (*)"),
            (f"(*) Monto publicado en el portal, puede estar desactualizado; confirmalo en la oficina.", None),
            ("Montos calculados con el valor del módulo (servicios varios: $1.007,35) vigente desde 01/10/2026, según el Código Tarifario 2026; fuente: portal oficial, consultado el 06/11/2026.", None),
        ])
        self.assertEqual([v["texto"] for v in viejos], ["$125 Libre deuda emitida por Administración de Ingresos Municipales (AIM)"])

    def test_los_montos_entran_en_lo_que_ve_el_chat(self):
        filas, _ = self.costos(["$125 Libre deuda emitida por Administración de Ingresos Municipales (AIM)", "$85 Libre deuda emitida por Tribunal de Faltas", "$68 Libre deuda emitida por Direccion de Transito"])
        en_una_linea = "; ".join(f["concepto"] + (f": {f['importe']}" if f["importe"] else "") for f in filas)
        for dato in ("$4.029,40", "vigente desde 01/10/2026", "$ 85", "$ 68", "(*) Monto publicado en el portal"):
            self.assertLess(en_una_linea.index(dato), 300 - len(dato), dato)

    def test_unidades_tributarias(self):
        filas, viejos = self.costos(["1 U.T (1 U.T $250) por actividades administrativas (Estudio de Dominio)", "Libre Deuda T.F.: Tasa administrativa de 3 Unidades Tributarias (1UT:$10)"])
        self.assertEqual(filas[0]["concepto"], "1) Por actividades administrativas (Estudio de Dominio)")
        self.assertEqual(filas[0]["importe"], "6 módulos: $6.044,10 (módulo vigente desde 01/10/2026)")
        self.assertEqual(filas[1], {"concepto": "2) Libre Deuda T.F.: Tasa administrativa de 3 Unidades Tributarias (1UT:$10) (*)", "importe": None})
        self.assertEqual(len(viejos), 1)

    def test_costo_generico_usa_el_titulo(self):
        filas, viejos = self.costos(["Costo del trámite por primera vez: $ 6.247,12."], titulo="Requisitos para obtener Carnet de Sanidad")
        self.assertTrue(filas[0]["importe"].startswith("8 módulos: $8.058,80, calculado"))
        self.assertEqual(len(viejos), 1)

    def test_modulos_con_pesos_viejos_en_la_misma_linea(self):
        filas, viejos = self.costos(["SEGÚN DIMENSIONES DEL LOCAL A HABILITAR ART. 36 INC. A ($100)", "Hasta 25 m 2 : 3 Módulos $ 730.00", "EMISIÓN DEL CERTIFICADO DE HABILITACIÓN: 5 Módulos ($49,08) = $ 245.40."])
        self.assertEqual(filas[0]["concepto"], "1) Según dimensiones del local a habilitar (hasta 25 m 2)")
        self.assertEqual(filas[0]["importe"], "3 módulos: $15.110,28 (módulo de habilitaciones, vigente desde 01/10/2026)")
        self.assertEqual(filas[1]["concepto"], "2) Emisión del certificado de habilitación")
        self.assertEqual(filas[1]["importe"], "5 módulos: $5.036,75 (módulo de servicios varios, vigente desde 01/10/2026)")
        self.assertEqual([f["concepto"] for f in filas[2:]], [
            "Montos calculados con el valor del módulo (habilitaciones: $5.036,76) vigente desde 01/10/2026, según el Código Tarifario 2026; fuente: portal oficial, consultado el 06/11/2026.",
            "Montos calculados con el valor del módulo (servicios varios: $1.007,35) vigente desde 01/10/2026, según el Código Tarifario 2026; fuente: portal oficial, consultado el 06/11/2026.",
        ])
        self.assertEqual(len(viejos), 3)

    def test_estampilla_en_los_requisitos(self):
        viejos = []
        requisitos = "\n".join([
            "1.- Estudio de Dominio del Inmueble. Estampilla de $295.00.-",
            "5.- Certificado de Libre Falta. Estampilla de $122.70-",
            "Póliza por el monto de $22.000.000",
        ])
        texto = m.pesos_en_requisitos(requisitos, MODULO, CONSULTA, [], "Habilitación", viejos)
        lineas = texto.split("\n")
        self.assertIn("Estampilla de 6 módulos: $6.044,10, calculado", lineas[0])
        self.assertNotIn("295", lineas[0])
        self.assertEqual(lineas[1], f"5.- Certificado de Libre Falta. Estampilla de $122.70 ({m.ADVERTENCIA})-")
        self.assertEqual(lineas[2], "Póliza por el monto de $22.000.000")
        self.assertEqual(len(viejos), 1)


class Telefonos(unittest.TestCase):
    def test_celulares_fuera_y_fijos_adentro(self):
        descartes = []
        t = m.sin_datos_personales("Tel: 4436181 Cel: 3704-336465/336516/336372. Contacto: 3704-012377 (solo whatsapp). Call Center: 0800 9999 147. (0370) 442-0000", descartes)
        self.assertEqual(t, f"Tel: 4436181 {m.SIN_TELEFONO}. Contacto: {m.SIN_TELEFONO}. Call Center: 0800 9999 147. (0370) 442-0000")
        self.assertEqual([d["tipo"] for d in descartes], ["teléfono celular", "teléfono celular"])
        self.assertNotIn("336465", repr(descartes))


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
        self.assertEqual(tipos, ["correo no institucional", "nombre de persona", "responsable", "teléfono celular", "teléfono celular"])

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
