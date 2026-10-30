import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import "./ContactoPage.css";

const FAQS = [
  {
    question: "¿Qué tipo de consultas puedo hacer en ChatAP?",
    answer: "Podés consultar por trámites de la Administración Pública de Formosa que estén publicados en ChatAP. Según la información cargada para cada trámite, el asistente puede orientarte sobre su descripción, requisitos, costos, dónde se realiza y documentos disponibles.",
  },
  {
    question: "¿Necesito una cuenta para hacer consultas?",
    answer: "No. Podés consultar en ChatAP sin iniciar sesión. El servicio permite identificar una cuenta cuando iniciás sesión, pero la consulta pública no requiere registrarte.",
  },
  {
    question: "¿De dónde obtiene ChatAP la información?",
    answer: "ChatAP busca coincidencias en el catálogo de trámites publicados y utiliza esos datos para elaborar la respuesta. La información puede incluir descripción, requisitos, costos, mesas de entrada y documentos que hayan sido cargados para el trámite.",
  },
  {
    question: "¿Qué pasa si mi consulta puede referirse a más de un trámite?",
    answer: "Si encuentra varias opciones que podrían corresponder a lo que necesitás, ChatAP puede pedirte una aclaración para identificar el trámite correcto. Elegí la opción que describa mejor tu situación.",
  },
  {
    question: "¿Puedo consultar o descargar documentos?",
    answer: "Sí, cuando un trámite publicado tiene documentos adjuntos. ChatAP puede mostrarte los documentos disponibles y permitirte acceder a su descarga.",
  },
  {
    question: "¿ChatAP puede iniciar un trámite o consultar mi expediente?",
    answer: "No. ChatAP brinda orientación a partir de la información publicada, pero no inicia trámites, no recibe documentación para gestionarlos ni consulta el estado de expedientes.",
  },
  {
    question: "¿Qué hago si ChatAP no encuentra información?",
    answer: "Probá reformular la consulta o indicar el nombre del trámite. Si no hay información suficiente entre los trámites publicados, ChatAP te lo indicará y podrás consultar en la mesa de entrada correspondiente.",
  },
  {
    question: "¿Cómo recupero la contraseña de mi cuenta?",
    answer: "En la pantalla de ingreso, elegí «Olvidé mi contraseña» e ingresá el correo asociado a tu cuenta. Si la cuenta está registrada y habilitada, el sistema enviará un enlace para restablecerla. El enlace tiene una vigencia limitada.",
  },
];

const SUPPORT_PATHS = [
  {
    id: "chat",
    number: "01",
    eyebrow: "Consultas sobre trámites",
    title: "Hablá con ChatAP",
    description: "Contanos qué necesitás resolver. Podés escribir con tus propias palabras, sin conocer términos administrativos.",
    action: "Ir al asistente",
    to: "/chat",
    icon: "chat",
    featured: true,
  },
  {
    id: "account",
    number: "02",
    eyebrow: "Acceso y cuenta",
    title: "Problemas para ingresar",
    description: "Si no podés acceder a tu cuenta, revisá tus datos de ingreso o solicitá un enlace para restablecer tu contraseña.",
    action: "Ir a ingresar",
    to: "/login",
    icon: "account",
  },
];

function SupportIcon({ name }) {
  if (name === "chat") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7.5 18.5 3.8 20l1.1-3.7A8.5 8.5 0 1 1 7.5 18.5Z" />
        <path d="M8 10h8M8 13.5h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 19 6v5.2c0 4.3-2.8 7.6-7 9.3-4.2-1.7-7-5-7-9.3V6l7-2.5Z" />
      <path d="M9 11.5a3 3 0 1 1 5.2 2c-.9.8-2.2 1.2-2.2 2.5M12 18h.01" />
    </svg>
  );
}

export default function ContactoPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [reportFileError, setReportFileError] = useState("");

  function handleReportFile(event) {
    const file = event.target.files?.[0] || null;
    setReportFileError("");
    if (!file) { setReportFile(null); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setReportFile(null);
      setReportFileError("Elegí una imagen JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setReportFile(null);
      setReportFileError("La imagen no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }
    setReportFile(file);
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-brand-deep/10 selection:text-brand-deep">
      <Navbar />

      <main id="contenido" aria-label="Centro de ayuda y soporte" className="flex-1 w-full">
        <section className="support-hero section-bleed">
          <div className="ed-max support-hero__inner">
            <nav className="support-breadcrumb" aria-label="Ruta de navegación">
              <Link to="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Soporte</span>
            </nav>

            <div className="support-hero__copy">
              <span className="support-eyebrow">
                <span className="support-eyebrow__mark" aria-hidden="true" />
                Centro de ayuda ChatAP
              </span>
              <h1>Estamos para orientarte.</h1>
              <p>
                Encontrá el camino para resolver tu consulta, acceder a tu cuenta
                o aprovechar mejor las herramientas de ChatAP.
              </p>
            </div>

            <div className="support-hero__bottom">
              <span className="support-hero__caption">Una ayuda clara, paso a paso.</span>
              <a href="#opciones" className="support-hero__scroll">
                Explorar opciones <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>

        <section id="opciones" className="support-options section-bleed">
          <div className="ed-max">
            <div className="support-section-heading">
              <div>
                <span className="support-section-heading__eyebrow">¿Qué necesitás resolver?</span>
                <h2>Empezá por acá.</h2>
              </div>
              <p>Elegí la opción que mejor se adapte a lo que estás buscando.</p>
            </div>

            <div className="support-paths">
              {SUPPORT_PATHS.map((item) => (
                <article
                  key={item.id}
                  className={`support-path ${item.featured ? "support-path--featured" : ""}`}
                >
                  <div className="support-path__top">
                    <span className="support-path__icon">
                      <SupportIcon name={item.icon} />
                    </span>
                    <span className="support-path__number">{item.number}</span>
                  </div>
                  <div className="support-path__content">
                    <span className="support-path__eyebrow">{item.eyebrow}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <Link to={item.to} className="support-path__link">
                    {item.action} <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="support-report-section section-bleed" id="reportar">
          <div className="ed-max support-report-layout">
            <div className="support-report-intro">
              <span className="support-section-heading__eyebrow">¿Algo no funcionó?</span>
              <h2>Contanos qué pasó.</h2>
              <p>
                Si encontraste un error o tuviste un inconveniente al usar ChatAP,
                podés preparar un reporte para que el equipo pueda revisarlo.
              </p>
              <div className="support-report-note">
                <span className="support-report-note__icon" aria-hidden="true">i</span>
                <p>
                  No incluyas contraseñas, códigos de seguridad ni información
                  sensible. La captura es opcional y debería mostrar únicamente
                  el inconveniente.
                </p>
              </div>
            </div>

            <form className="support-report-form" onSubmit={(event) => event.preventDefault()}>
              <div className="support-report-form__heading">
                <div>
                  <span className="support-report-form__eyebrow">Formulario de reporte</span>
                  <h3>Describí el inconveniente</h3>
                </div>
                <span className="support-report-form__required">* Campos obligatorios</span>
              </div>

              <div className="support-report-fields">
                <label className="support-report-field">
                  <span>Nombre y apellido <b>*</b></span>
                  <input type="text" name="nombre" autoComplete="name" placeholder="Cómo podemos llamarte" required />
                </label>
                <label className="support-report-field">
                  <span>Correo electrónico <b>*</b></span>
                  <input type="email" name="email" autoComplete="email" placeholder="nombre@correo.com" required />
                </label>
                <label className="support-report-field">
                  <span>Teléfono <small>(opcional)</small></span>
                  <input type="tel" name="telefono" autoComplete="tel" placeholder="Tu número de contacto" />
                </label>
                <label className="support-report-field">
                  <span>Motivo del reporte <b>*</b></span>
                  <select name="categoria" defaultValue="" required>
                    <option value="" disabled>Seleccioná una categoría</option>
                    <option value="chat">Problema con ChatAP</option>
                    <option value="cuenta">Acceso o cuenta</option>
                    <option value="tramites">Información de trámites</option>
                    <option value="documentos">Documentos o archivos</option>
                    <option value="otro">Otro inconveniente</option>
                  </select>
                </label>
                <label className="support-report-field support-report-field--full">
                  <span>¿Qué ocurrió? <b>*</b></span>
                  <textarea name="descripcion" rows="5" minLength="15" maxLength="1500" placeholder="Describí qué estabas intentando hacer, qué sucedió y si apareció algún mensaje de error." required />
                  <small>Incluí todos los detalles que puedan ayudar a comprender el problema (hasta 1.500 caracteres).</small>
                </label>
                <div className="support-report-field support-report-field--full">
                  <span>Captura de pantalla <small>(opcional)</small></span>
                  <label className="support-report-upload" htmlFor="support-report-file">
                    <span className="support-report-upload__icon" aria-hidden="true">↑</span>
                    <span>
                      <strong>{reportFile ? reportFile.name : "Adjuntar una imagen"}</strong>
                      <small>{reportFile ? `${(reportFile.size / 1024 / 1024).toFixed(2)} MB · Archivo seleccionado` : "JPG, PNG o WEBP · Máximo 5 MB"}</small>
                    </span>
                    <span className="support-report-upload__action">{reportFile ? "Cambiar" : "Elegir archivo"}</span>
                    <input id="support-report-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleReportFile} />
                  </label>
                  {reportFileError && <p className="support-report-error" role="alert">{reportFileError}</p>}
                  {reportFile && (
                    <button className="support-report-remove" type="button" onClick={() => { setReportFile(null); setReportFileError(""); const input = document.getElementById("support-report-file"); if (input) input.value = ""; }}>
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>

              <div className="support-report-submit">
                <p role="status">
                  El envío de reportes estará disponible cuando se habilite la recepción segura en el sistema.
                </p>
                <button type="submit" disabled title="Pendiente de conexión con el servicio de reportes">
                  Envío pendiente de habilitación
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="support-faq-section section-bleed" id="preguntas">
          <div className="ed-max support-faq-layout">
            <div className="support-faq-intro">
              <span className="support-section-heading__eyebrow">Respuestas útiles</span>
              <h2>Preguntas frecuentes.</h2>
              <p>
                Reunimos respuestas para que puedas conocer mejor el servicio y
                continuar con más claridad.
              </p>
              <div className="support-faq-aside">
                <span className="support-faq-aside__icon" aria-hidden="true">i</span>
                <p>
                  ChatAP orienta con la información disponible en la plataforma.
                  Para confirmar un requisito o una condición particular, verificá
                  siempre los datos con el organismo responsable.
                </p>
              </div>
            </div>

            <div className="support-faq-list">
              {FAQS.map((item, index) => {
                const isOpen = openFaq === index;
                const answerId = `support-faq-answer-${index}`;
                const triggerId = `support-faq-trigger-${index}`;

                return (
                  <article
                    className={`support-faq-item ${isOpen ? "is-open" : ""}`}
                    key={item.question}
                  >
                    <h3 className="support-faq-item__heading">
                      <button
                        type="button"
                        id={triggerId}
                        className="support-faq-item__trigger"
                        aria-expanded={isOpen}
                        aria-controls={answerId}
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                      >
                        <span className="support-faq-item__number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="support-faq-item__question">{item.question}</span>
                        <span className="support-faq-item__toggle" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </span>
                      </button>
                    </h3>
                    <div
                      id={answerId}
                      className="support-faq-item__answer"
                      role="region"
                      aria-labelledby={triggerId}
                      aria-hidden={!isOpen}
                    >
                      <div className="support-faq-item__answer-inner">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="support-closing section-bleed">
          <div className="ed-max">
            <div className="support-closing__panel">
              <div className="support-closing__copy">
                <span className="support-eyebrow">
                  <span className="support-eyebrow__mark" aria-hidden="true" />
                  Seguimos con vos
                </span>
                <h2>Tu próxima respuesta puede empezar con una pregunta.</h2>
                <p>
                  Escribí qué necesitás resolver. ChatAP te ayuda a encontrar
                  orientación sobre trámites y servicios.
                </p>
              </div>
              <Link to="/chat" className="support-closing__button">
                Consultar en ChatAP <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
