import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import "./ContactoPage.css";

const FAQS = [
  {
    question: "¿Qué tipo de consultas puedo hacer en ChatAP?",
    answer: "Podés consultar sobre trámites de la Administración Pública de Formosa. Cuando la información está disponible, ChatAP puede orientarte sobre requisitos, costos, documentación y lugares de presentación.",
  },
  {
    question: "¿Necesito tener una cuenta para usar ChatAP?",
    answer: "No. Podés realizar consultas desde el chat sin registrarte ni iniciar sesión. Si tenés una cuenta, también podés acceder a las funciones habilitadas para usuarios registrados.",
  },
  {
    question: "¿Cómo se elaboran las respuestas?",
    answer: "ChatAP busca información en los trámites y contenidos disponibles en la plataforma. Si un dato no está cargado o no encuentra información suficiente, puede indicarte que reformules la consulta o que te acerques a una mesa de entrada.",
  },
  {
    question: "¿Qué sucede si hay varios trámites parecidos?",
    answer: "Puede hacerte una pregunta breve para distinguir cuál necesitás. Respondé con la opción que corresponda y continuará la orientación.",
  },
  {
    question: "¿Puedo descargar formularios o documentación?",
    answer: "Cuando la ficha de un trámite tiene documentos adjuntos publicados, ChatAP puede mostrarte los archivos disponibles para consultarlos o descargarlos.",
  },
  {
    question: "¿ChatAP puede iniciar un trámite o consultar mi expediente?",
    answer: "ChatAP brinda orientación, pero no presenta documentación ni gestiona expedientes. La consulta de estado de expedientes mediante SIGED no está disponible como función confirmada en el servicio público revisado.",
  },
  {
    question: "¿Qué hago si no encuentro la respuesta que necesito?",
    answer: "Probá describir tu necesidad con otras palabras o mencioná el nombre del trámite. Si ChatAP no encuentra información suficiente, consultá directamente en la mesa de entrada correspondiente.",
  },
  {
    question: "Olvidé mi contraseña, ¿cómo puedo recuperarla?",
    answer: "Desde la pantalla de ingreso, elegí la opción para recuperar tu contraseña e ingresá el correo asociado a tu cuenta. Si está registrado y habilitado, recibirás un enlace para crear una nueva contraseña.",
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
  const [openFaq, setOpenFaq] = useState(0);

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
