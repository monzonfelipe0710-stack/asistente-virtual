import { Link } from "react-router-dom";

const CONTENT = {
  terms: {
    eyebrow: "Información del servicio",
    title: "Términos y Condiciones",
    intro: "Estas condiciones describen las pautas generales para utilizar ChatAP, el asistente virtual de orientación sobre trámites y servicios de Recursos Humanos de la Provincia de Formosa.",
    sections: [
      { title: "1. Sobre el servicio", paragraphs: [
        "ChatAP ofrece información y orientación automatizada sobre consultas administrativas, trámites, expedientes y temas relacionados con sus funciones disponibles.",
        "El servicio y sus funcionalidades pueden actualizarse, limitarse o interrumpirse por tareas de mantenimiento, razones técnicas o decisiones de la institución responsable."
      ]},
      { title: "2. Registro y cuidado de la cuenta", paragraphs: [
        "La persona usuaria debe proporcionar información correcta al registrarse y mantener bajo su control las credenciales de acceso. Si sospecha que otra persona accedió a su cuenta, debe utilizar los canales oficiales de soporte disponibles.",
        "No compartas contraseñas, códigos de acceso ni información personal de terceros en una consulta, salvo que sea estrictamente necesario para el trámite y el sistema lo permita."
      ]},
      { title: "3. Uso adecuado", paragraphs: [
        "El sistema debe utilizarse de manera lícita y respetuosa. No se permite intentar acceder a cuentas ajenas, interferir con el funcionamiento del servicio, introducir código malicioso ni utilizarlo para vulnerar derechos de otras personas.",
        "Las consultas deben estar relacionadas con el propósito del servicio. No incluyas datos sensibles o documentación de terceros si no es necesario."
      ]},
      { title: "4. Alcance de las respuestas", paragraphs: [
        "Las respuestas automáticas son orientativas y pueden contener errores, estar incompletas o no reflejar una actualización normativa reciente. Cuando una decisión dependa de una norma, un expediente o una evaluación administrativa, verificá la información por los canales oficiales correspondientes.",
        "Una respuesta del asistente no reemplaza una resolución administrativa, una notificación oficial ni el asesoramiento de la autoridad competente. Los plazos y requisitos deben confirmarse en la fuente oficial del trámite."
      ]},
      { title: "5. Documentos e imágenes", paragraphs: [
        "Si la plataforma permite adjuntar imágenes o archivos, cargá únicamente materiales relacionados con tu consulta y que estés autorizado a compartir. Evitá incluir contraseñas, datos bancarios o información personal de otras personas que no sea necesaria."
      ]},
      { title: "6. Disponibilidad y cambios", paragraphs: [
        "No se garantiza que el servicio esté disponible de forma ininterrumpida ni que todas las funciones estén habilitadas en todo momento. Las condiciones podrán actualizarse para reflejar cambios en el servicio o en la normativa aplicable. La versión vigente deberá publicarse en esta página con su fecha de actualización."
      ]},
      { title: "7. Propiedad intelectual", paragraphs: [
        "Los nombres, marcas, diseños, textos y componentes del servicio pertenecen a sus titulares correspondientes o se utilizan con la autorización aplicable. No se concede permiso para reutilizarlos de forma que sugiera una aprobación institucional inexistente."
      ]},
      { title: "8. Contacto y responsable del servicio", paragraphs: [
        "Responsable institucional: [COMPLETAR NOMBRE OFICIAL DEL ORGANISMO RESPONSABLE].",
        "Canal oficial de consultas sobre estas condiciones: [COMPLETAR CORREO O CANAL OFICIAL VERIFICADO]."
      ]}
    ]
  },
  privacy: {
    eyebrow: "Tus datos personales",
    title: "Política de Privacidad",
    intro: "Esta página explica, en términos generales, qué información puede tratar ChatAP cuando utilizás el servicio. El texto requiere validación institucional antes de considerarse la política oficial definitiva.",
    sections: [
      { title: "1. Responsable del tratamiento", paragraphs: [
        "Responsable institucional y datos de contacto: [COMPLETAR NOMBRE LEGAL DEL RESPONSABLE, DOMICILIO Y CANAL OFICIAL DE CONTACTO]. Esta información debe ser confirmada por la institución antes de publicar la política como definitiva."
      ]},
      { title: "2. Qué información puede recopilarse", paragraphs: [
        "Según las funciones que utilices y la configuración efectiva del sistema, la plataforma puede tratar datos de registro e identificación (por ejemplo, nombre, correo electrónico o documento), el contenido de las consultas, los archivos o imágenes que decidas adjuntar y datos técnicos necesarios para operar y proteger el servicio.",
        "No envíes contraseñas, datos bancarios ni información sensible que no sea necesaria para resolver tu consulta. Si compartís datos de otra persona, asegurate de tener una base legítima para hacerlo."
      ]},
      { title: "3. Para qué se utiliza la información", paragraphs: [
        "La información puede utilizarse para crear y administrar la cuenta, responder consultas, mostrar el historial asociado a la cuenta, mantener la seguridad, diagnosticar errores y mejorar el funcionamiento del servicio, siempre de acuerdo con las finalidades que la institución responsable determine y comunique."
      ]},
      { title: "4. Consultas, archivos y servicios externos", paragraphs: [
        "El contenido que escribís y los archivos que adjuntás pueden necesitar procesamiento técnico para generar una respuesta. Si el sistema utiliza proveedores externos de infraestructura o inteligencia artificial, la institución debe identificar esos proveedores, las finalidades del intercambio, la ubicación del tratamiento y las condiciones aplicables antes de publicar esta política como definitiva.",
        "Proveedores utilizados y categorías de datos compartidos: [COMPLETAR TRAS VERIFICAR LA CONFIGURACIÓN DE PRODUCCIÓN Y LOS CONTRATOS APLICABLES]."
      ]},
      { title: "5. Conservación y seguridad", paragraphs: [
        "Los datos deben conservarse solo durante el plazo necesario para las finalidades informadas y de acuerdo con las obligaciones legales y administrativas aplicables. El plazo concreto de conservación del registro, el historial, los archivos y los registros técnicos debe ser definido y publicado por el responsable institucional.",
        "La plataforma debe implementar medidas de seguridad adecuadas. Ningún sistema puede prometer seguridad absoluta; no incluyas en tus consultas información que no sea necesaria."
      ]},
      { title: "6. Derechos de las personas", paragraphs: [
        "De acuerdo con la normativa aplicable en Argentina, las personas pueden contar con derechos de acceso, rectificación y, cuando corresponda, supresión de sus datos personales. La forma de ejercerlos, las excepciones aplicables y los plazos deben ser atendidos por el responsable del tratamiento conforme a la Ley 25.326 y su normativa complementaria.",
        "Canal para solicitudes sobre datos personales: [COMPLETAR CORREO, FORMULARIO O DEPENDENCIA OFICIAL VERIFICADA]."
      ]},
      { title: "7. Cookies, almacenamiento local y sesión", paragraphs: [
        "La aplicación puede utilizar almacenamiento del navegador para mantener la sesión, recordar preferencias o registrar el estado de funciones de la interfaz. El alcance exacto debe verificarse en la implementación desplegada y explicarse aquí, incluyendo cualquier cookie o tecnología de terceros que se utilice."
      ]},
      { title: "8. Cambios en esta política", paragraphs: [
        "Esta política puede actualizarse cuando cambien las funciones, los proveedores o las obligaciones aplicables. La versión publicada debe indicar su fecha de vigencia y los cambios relevantes."
      ]}
    ]
  }
};

export default function LegalPage({ type = "terms" }) {
  const page = CONTENT[type] || CONTENT.terms;
  const updatedAt = "22 de octubre de 2026";

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="border-b border-line bg-mist/40">
        <div className="ed-max section-bleed py-12 sm:py-16">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-deep no-underline transition-colors hover:text-brand">
            <span aria-hidden="true">←</span> Volver al inicio
          </Link>
          <p className="mt-8 mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand">{page.eyebrow}</p>
          <h1 className="m-0 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">{page.title}</h1>
          <p className="mt-5 mb-0 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">{page.intro}</p>
          <p className="mt-4 mb-0 text-xs text-muted">Última actualización: {updatedAt}</p>
        </div>
      </section>

      <div className="ed-max section-bleed grid grid-cols-1 gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
        <article className="min-w-0 max-w-3xl">
          <div className="mb-8 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
            <strong className="block mb-1">Pendiente de validación institucional</strong>
            Este contenido es un borrador informativo. Los campos entre corchetes deben completarse y el documento debe ser revisado por el organismo responsable antes de presentarse como texto legal definitivo.
          </div>
          <div className="space-y-9">
            {page.sections.map((section, index) => (
              <section key={section.title} id={`legal-section-${index}`} className="legal-section scroll-mt-6">
                <h2 className="mb-3 mt-0 text-xl font-bold tracking-tight sm:text-2xl">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-3 mt-0 text-sm leading-7 text-muted sm:text-base">{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
          <div className="mt-12 border-t border-line pt-6">
            <p className="m-0 text-sm text-muted">¿Necesitás ayuda con el servicio?</p>
            <Link to="/contacto" className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-deep px-5 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-brand">
              Ir a contacto y soporte
            </Link>
          </div>
        </article>

        <aside className="h-fit rounded-2xl border border-line bg-mist/40 p-5 lg:sticky lg:top-6">
          <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-muted">En esta sección</p>
          <nav aria-label="Secciones del documento" className="mt-4">
            <ul className="m-0 list-none space-y-3 p-0">
              {page.sections.map((section, index) => (
                <li key={section.title}>
                  <a href={`#legal-section-${index}`} className="text-sm leading-snug text-muted no-underline transition-colors hover:text-brand-deep">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
      <div className="border-t border-line bg-mist/30">
        <div className="ed-max section-bleed py-5">
          <p className="m-0 text-xs leading-relaxed text-muted">ChatAP · Recursos Humanos · Provincia de Formosa. Para conocer la versión oficial, verificá las publicaciones del organismo responsable.</p>
        </div>
      </div>
    </main>
  );
}
