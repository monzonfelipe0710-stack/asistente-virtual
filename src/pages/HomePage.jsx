import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import ChatBotAvatar from "../components/ChatBotAvatar";
import "../styles/home.css";

const CAPABILITIES = [
  ["01", "Trámites", "Conocé los pasos necesarios para realizar tus gestiones.", "#chatap"],
  ["02", "Requisitos", "Identificá qué documentación necesitás presentar.", "#chatap"],
  ["03", "Documentación", "Encontrá documentos y recursos relacionados con tus gestiones.", "#chatap"],
  ["04", "Orientación", "Recibí orientación para saber por dónde empezar.", "#chatap"],
];

function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const items = root.querySelectorAll(".home-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return ref;
}

export function HomePage() {
  const pageRef = useReveal();

  useEffect(() => {
    const hero = document.querySelector(".home-hero");
    if (!hero) return undefined;

    const update = () => {
      const max = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      hero.style.setProperty("--hero-x", (progress * 22).toFixed(2));
      hero.style.setProperty("--hero-y", (progress * -18).toFixed(2));
      hero.style.setProperty("--hero-scale", (1 - progress * 0.12).toFixed(4));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={pageRef} className="home-page">
      <Navbar />

      <main>
        <section id="inicio" className="home-hero home-anchor" aria-labelledby="home-title">
          <div className="home-hero__sticky">
            <div className="home-hero__grid">
              <p className="home-hero__eyebrow">
                <span className="home-hero__eyebrow-dot" aria-hidden="true" />
                Asistente inteligente · Administración Pública
              </p>

              <h1 id="home-title" className="home-hero__title">
                Menos vueltas.<br />
                <span className="accent">Más respuestas.</span>
              </h1>

              <p className="home-hero__copy">
                ChatAP te acerca información sobre trámites, requisitos y documentación de la Administración Pública de Formosa, en un lenguaje claro y fácil de consultar.
              </p>

              <div className="home-hero__actions">
                <Link to="/chat" className="home-button home-button--primary">
                  Consultar a ChatAP <span aria-hidden="true">→</span>
                </Link>
                <a href="#chatap" className="home-button home-button--secondary">
                  Conocer ChatAP <span aria-hidden="true">↓</span>
                </a>
              </div>

              <div className="home-hero__meta" aria-label="Información institucional">
                <span><i aria-hidden="true" /> Formosa</span>
                <span>Subsecretaría de Recursos Humanos</span>
                <span>Información administrativa</span>
              </div>

              <div className="home-hero__side" aria-hidden="true">
                <div className="home-hero__orb" />
                <span className="home-hero__node" />
                <span className="home-hero__node" />
                <span className="home-hero__node" />
              </div>
            </div>

            <div className="home-hero__scroll" aria-hidden="true">
              <span>Deslizá para descubrir</span>
              <span className="home-hero__scroll-line" />
            </div>
          </div>
        </section>

        <section id="chatap" className="home-section home-intro home-anchor">
          <div className="home-container home-intro__layout">
            <div className="home-reveal">
              <p className="home-section__eyebrow">01 / La idea</p>
              <h2 className="home-display">Encontrar una respuesta no debería ser un trámite.</h2>
            </div>
            <div className="home-intro__aside home-reveal home-delay-1">
              <strong>Una nueva forma de orientarte.</strong>
              <p className="home-copy">
                ChatAP funciona como un punto de acceso sencillo a la información administrativa: preguntás con tus propias palabras y recibís orientación para avanzar.
              </p>
            </div>
          </div>
        </section>

        <section className="home-section home-bot home-anchor" aria-labelledby="bot-title">
          <div className="home-container home-bot__layout">
            <div>
              <p className="home-section__eyebrow home-reveal">02 / Conocé al asistente</p>
              <h2 id="bot-title" className="home-bot__title home-reveal home-delay-1">Este es ChatAP.</h2>
              <p className="home-bot__copy home-reveal home-delay-2">
                Un asistente inteligente creado para acompañarte cuando necesitás información de la Administración Pública. Su identidad visual te acompaña a lo largo de la experiencia.
              </p>
              <div className="home-hero__actions home-reveal home-delay-3">
                <Link to="/chat" className="home-button home-button--primary">
                  Hablar con ChatAP <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="home-bot__stage home-reveal home-delay-1">
              <div className="home-bot__halo" aria-hidden="true" />
              <div className="home-bot__avatar">
                <ChatBotAvatar size={300} reaction="idle" followMouse />
              </div>
              <div className="home-bot__badge">Asistente activo</div>
            </div>
          </div>
        </section>

        <section id="servicios" className="home-section home-capabilities home-anchor" aria-labelledby="capabilities-title">
          <div className="home-container">
            <div className="home-capabilities__head home-reveal">
              <div>
                <p className="home-section__eyebrow">03 / Lo que podés consultar</p>
                <h2 id="capabilities-title" className="home-display">Una pregunta puede ser el comienzo.</h2>
              </div>
              <p className="home-copy">Desde una gestión concreta hasta la documentación que necesitás para avanzar.</p>
            </div>

            <div className="home-capability-list">
              {CAPABILITIES.map(([number, title, description, href], index) => (
                <a key={title} href={href} className={`home-capability home-reveal home-delay-${Math.min(index + 1, 3)}`}>
                  <span className="home-capability__number">{number}</span>
                  <span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </span>
                  <span className="home-capability__arrow" aria-hidden="true">→</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="soporte" className="home-section home-chat home-anchor" aria-labelledby="preview-title">
          <div className="home-container home-chat__layout">
            <div>
              <p className="home-section__eyebrow home-reveal">04 / Así se siente</p>
              <h2 id="preview-title" className="home-display home-reveal home-delay-1">Preguntá. ChatAP te orienta.</h2>
              <p className="home-copy home-reveal home-delay-2">
                La conversación es el punto de partida. El objetivo es que puedas expresar lo que necesitás sin aprender cómo funciona la Administración por dentro.
              </p>
            </div>

            <div className="home-chat__window home-reveal home-delay-1" aria-label="Vista previa del asistente ChatAP">
              <div className="home-chat__top">
                <div className="home-chat__brand">
                  <ChatBotAvatar size={34} isStatic reaction="idle" />
                  ChatAP
                </div>
                <span className="home-chat__status"><i aria-hidden="true" /> Disponible</span>
              </div>
              <div className="home-chat__body">
                <div className="home-chat__bubble home-chat__bubble--bot">Hola. Soy ChatAP. ¿Qué información administrativa necesitás?</div>
                <div className="home-chat__bubble home-chat__bubble--user">Necesito saber qué documentación presentar para mi trámite.</div>
                <div className="home-chat__bubble home-chat__bubble--bot">Puedo orientarte sobre los requisitos y los pasos a seguir. Empecemos por identificar el trámite.</div>
                <div className="home-chat__input">
                  <span>Escribí tu consulta...</span>
                  <span className="home-chat__send" aria-hidden="true">↑</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-final home-anchor" aria-labelledby="final-title">
          <div className="home-container">
            <p className="home-section__eyebrow home-reveal" style={{ justifyContent: "center" }}>05 / Empezá acá</p>
            <h2 id="final-title" className="home-reveal home-delay-1">¿Tenés una consulta?</h2>
            <p className="home-reveal home-delay-2">Tu próxima respuesta puede empezar con una pregunta.</p>
            <Link to="/chat" className="home-button home-button--primary home-reveal home-delay-3">
              Consultar a ChatAP <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
