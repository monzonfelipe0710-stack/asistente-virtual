import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import heroAvatar from "../assets/hero.png";

const capabilities = [
  {
    number: "01",
    title: "Trámites",
    text: "Conocé los pasos necesarios para realizar tus gestiones.",
  },
  {
    number: "02",
    title: "Requisitos",
    text: "Identificá qué documentación necesitás presentar.",
  },
  {
    number: "03",
    title: "Documentación",
    text: "Encontrá documentos y recursos relacionados con tus gestiones.",
  },
  {
    number: "04",
    title: "Orientación",
    text: "Recibí una guía clara para saber por dónde empezar.",
  },
];

function useScrollReveal() {
  const root = useRef(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    node.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return root;
}

export default function HomePage() {
  const root = useScrollReveal();

  return (
    <div className="chatap-home" ref={root}>
      <header className="chatap-nav">
        <Link className="chatap-brand" to="/" aria-label="ChatAP inicio">
          <span className="chatap-brand-mark">C</span>
          <span>ChatAP</span>
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#que-es">Qué es</a>
          <a href="#capacidades">Qué podés consultar</a>
          <Link className="chatap-nav-cta" to="/chat">Consultar a ChatAP</Link>
        </nav>
      </header>

      <main>
        <section className="chatap-hero" aria-labelledby="hero-title">
          <div className="chatap-hero-grid">
            <div className="chatap-hero-copy">
              <p className="chatap-eyebrow">ASISTENTE INTELIGENTE · FORMOSA</p>
              <h1 id="hero-title">
                Menos vueltas.<br />
                <span>Más respuestas.</span>
              </h1>
              <p className="chatap-hero-lead">
                La Administración Pública, ahora más cerca.
              </p>
              <p className="chatap-hero-description">
                Consultá información sobre trámites, requisitos y documentación de forma rápida y sencilla.
              </p>
              <div className="chatap-hero-actions">
                <Link className="chatap-button chatap-button-primary" to="/chat">
                  Consultar a ChatAP <span aria-hidden="true">↗</span>
                </Link>
                <a className="chatap-scroll-hint" href="#que-es">
                  Descubrí cómo funciona <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>

            <div className="chatap-hero-art" aria-hidden="true">
              <div className="chatap-orbit chatap-orbit-one" />
              <div className="chatap-orbit chatap-orbit-two" />
              <div className="chatap-hero-glow" />
              <div className="chatap-hero-number">01 / 06</div>
            </div>
          </div>
          <div className="chatap-hero-bottom">
            <span>SUBSECRETARÍA DE RECURSOS HUMANOS</span>
            <span>SCROLL PARA DESCUBRIR</span>
          </div>
        </section>

        <section id="que-es" className="chatap-intro chatap-section" data-reveal>
          <div className="chatap-section-label">01 — QUÉ ES CHATAP</div>
          <div className="chatap-intro-content">
            <h2>Encontrar una respuesta no debería ser un trámite.</h2>
            <p>
              ChatAP es un asistente inteligente pensado para acercar la información de la Administración Pública a las personas, con respuestas claras y orientación para saber qué hacer a continuación.
            </p>
          </div>
        </section>

        <section className="chatap-avatar-section chatap-section" data-reveal>
          <div className="chatap-avatar-copy">
            <div className="chatap-section-label">02 — CONOCÉ A CHATAP</div>
            <h2>Tu consulta.<br /><span>Una guía clara.</span></h2>
            <p>
              Un asistente creado para acompañarte cuando necesitás información sobre la Administración Pública.
            </p>
            <Link className="chatap-button chatap-button-secondary" to="/chat">
              Hablar con ChatAP <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="chatap-avatar-stage">
            <div className="chatap-avatar-ring" />
            <img src={heroAvatar} alt="Avatar de ChatAP" className="chatap-avatar" />
            <span className="chatap-avatar-tag">CHATAP / AI</span>
          </div>
        </section>

        <section id="capacidades" className="chatap-capabilities chatap-section" data-reveal>
          <div className="chatap-section-label">03 — PARA QUÉ PODÉS USARLO</div>
          <div className="chatap-capabilities-heading">
            <h2>Una pregunta<br /><span>puede ser el comienzo.</span></h2>
            <p>Información concreta para avanzar con tus gestiones sin perder tiempo buscando por distintos lugares.</p>
          </div>
          <div className="chatap-capability-list">
            {capabilities.map((item) => (
              <article className="chatap-capability" key={item.number}>
                <span>{item.number}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <span className="chatap-capability-arrow" aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="chatap-preview chatap-section" data-reveal>
          <div className="chatap-section-label">04 — UNA CONSULTA REAL</div>
          <div className="chatap-preview-heading">
            <h2>Preguntá.<br /><span>ChatAP te orienta.</span></h2>
          </div>
          <div className="chatap-chat-preview">
            <div className="chatap-chat-header">
              <div className="chatap-mini-avatar">C</div>
              <div><strong>ChatAP</strong><small>Asistente inteligente</small></div>
              <span className="chatap-online-dot" />
            </div>
            <div className="chatap-chat-body">
              <div className="chatap-message chatap-message-bot">Hola. ¿Qué necesitás consultar?</div>
              <div className="chatap-message chatap-message-user">¿Qué documentación necesito para iniciar un trámite?</div>
              <div className="chatap-message chatap-message-bot">Puedo orientarte con los requisitos y los pasos necesarios. Decime qué trámite querés realizar.</div>
            </div>
            <div className="chatap-chat-input">Escribí tu consulta... <span>↗</span></div>
          </div>
        </section>

        <section className="chatap-final-cta" data-reveal>
          <p className="chatap-eyebrow">05 — EMPEZÁ AHORA</p>
          <h2>¿Tenés una<br /><span>consulta?</span></h2>
          <p>Tu próxima respuesta puede empezar acá.</p>
          <Link className="chatap-button chatap-button-light" to="/chat">Consultar a ChatAP <span aria-hidden="true">↗</span></Link>
        </section>
      </main>

      <footer className="chatap-footer">
        <div><strong>ChatAP</strong><span>Asistente inteligente para la Administración Pública.</span></div>
        <span>Formosa · Argentina</span>
      </footer>
    </div>
  );
}
