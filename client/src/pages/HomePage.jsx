import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import InteractiveChatMockup from "../components/common/InteractiveChatMockup";
import ChatBotAvatar from "../components/ChatBotAvatar";
import HeroCinematicBackground from "../components/common/HeroCinematicBackground";
import ScrollFloat from "../components/common/ScrollFloat";
import useTheme from "../hooks/useTheme";

/* ------------------------------------------------------------------
   Contenidos Esenciales de HomePage Minimalista
   ------------------------------------------------------------------ */



const BENEFITS = [
  {
    id: "orientacion",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
      </svg>
    ),
    title: "Información sobre trámites",
    description: "Conocé los requisitos y los pasos informados para realizar distintas gestiones.",
  },
  {
    id: "documentos",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Requisitos y documentación",
    description: "Identificá qué documentación se menciona y dónde consultar la información correspondiente.",
  },
  {
    id: "acceso",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Consultas en lenguaje cotidiano",
    description: "Explicá qué necesitás con tus propias palabras y recibí orientación de forma sencilla.",
  },
];

const FAQ_ITEMS = [
  { id: "alcance", question: "¿Qué es ChatAP?", answer: "ChatAP es un asistente virtual que brinda orientación sobre trámites, requisitos e información de la Administración Pública de Formosa." },
  { id: "consultas", question: "¿Qué tipo de consultas puedo realizar?", answer: "Podés hacer preguntas sobre trámites y servicios públicos. La orientación disponible depende de la información incorporada al asistente." },
  { id: "tramites", question: "¿ChatAP realiza trámites por mí?", answer: "No. ChatAP brinda información y orientación para ayudarte a comprender los pasos. No presenta solicitudes ni reemplaza los canales oficiales de cada organismo." },
  { id: "registro", question: "¿Necesito iniciar sesión?", answer: "Podés ingresar al asistente desde el botón de consulta. Algunas funciones, como conservar conversaciones, pueden requerir que inicies sesión." },
  { id: "validez", question: "¿Las respuestas tienen validez oficial?", answer: "Las respuestas son orientativas y no reemplazan una resolución administrativa, una notificación oficial ni la confirmación de los requisitos ante el organismo correspondiente." },
];

function getInstitutionalLogos(isDark) {
  return [
    {
      id: "todos-unidos",
      title: "Todos Unidos",
      node: (
        <span className="institutional-mark institutional-mark--official" aria-hidden="true">
          <img
            src={isDark ? "/assets/logos/todos-unidos-dark.png" : "/assets/logos/todos-unidos-light.png"}
            alt="Todos Unidos"
            className="institutional-mark__image"
            draggable={false}
          />
        </span>
      ),
    },
    {
      id: "gobierno-formosa",
      title: "Gobierno de la Provincia de Formosa",
      node: (
        <span className="institutional-mark institutional-mark--official" aria-hidden="true">
          <img
            src={isDark ? "/assets/logos/gobierno-formosa-dark.png" : "/assets/logos/gobierno-formosa-light.png"}
            alt="Gobierno de Formosa"
            className="institutional-mark__image"
            draggable={false}
          />
        </span>
      ),
    },
    {
      id: "chatap",
      title: "ChatAP",
      node: (
        <span className="institutional-mark institutional-mark--chatap" aria-hidden="true">
          <span className="institutional-mark__monogram">AP</span>
          <span>ChatAP<span className="text-brand">.</span></span>
        </span>
      ),
    },
  ];
}

export default function HomePage() {
  const theme = useTheme();
  const [openFaq, setOpenFaq] = useState(null);

  const institutionalLogos = useMemo(
    () => getInstitutionalLogos(theme === "dark"),
    [theme]
  );

  const prefetchChat = () => {
    import("./CiudadanoPage").catch(() => {});
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-sans relative selection:bg-brand selection:text-white">
      <div className="home-atmosphere" aria-hidden="true" />

      <Navbar />

      <main id="contenido" aria-label="Página principal de ChatAP" className="flex-1 w-full relative z-10">
        {/* 1 · Hero Principal Minimalista y Directo */}
        {/* 1 · Hero Principal Cinematográfico y Editorial */}
        <section
          id="inicio"
          aria-label="Inicio ChatAP"
          className="hero-cinematic section-bleed relative flex flex-col justify-between"
        >
          {/* Layer 1 & 2: Fondo Cinematográfico con Ken Burns, Crossfade y Overlays */}
          <HeroCinematicBackground />

          <div className="ed-max hero-cinematic__inner relative z-10 flex flex-col items-center justify-center flex-1 w-full text-center px-4">
            {/* Gran Titular Editorial con ScrollFloat */}
            <div className="hero-anim-title max-w-4xl mx-auto">
              <ScrollFloat
                as="h1"
                mode="once"
                animationDuration={0.85}
                ease="power3.out"
                stagger={0.012}
                containerClassName="hero-cinematic__title-container"
                textClassName="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-ink leading-[1.08] m-0 block"
              >
                Información y orientación para tus trámites en Formosa.
              </ScrollFloat>
            </div>

            {/* Subtítulo comercial y directo */}
            <p className="hero-anim-sub mt-6 text-base sm:text-lg lg:text-xl text-muted max-w-2xl mx-auto leading-relaxed m-0 font-normal">
              Consultá información sobre trámites y servicios de la Administración Pública provincial, con una orientación clara y sencilla.
            </p>

            {/* Una única acción principal para mantener el foco */}
            <div className="hero-anim-cta hero-cta-group mt-8">
              <Link
                to="/chat"
                onPointerEnter={prefetchChat}
                className="btn-primary no-underline inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold normal-case tracking-normal shadow-lg shadow-brand/20 transition-all sm:text-base"
              >
                <span>Iniciar consulta</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

          </div>
          <div className="hero-anim-footer hero-cinematic__footer relative z-10 w-full bg-transparent">
            <div className="ed-max flex flex-col items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted/70 font-semibold m-0 select-none">
                Un proyecto del Gobierno de la Provincia de Formosa
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12" aria-label="Instituciones vinculadas al proyecto">
                {institutionalLogos.map((logo) => (
                  <div key={logo.id} className="flex items-center justify-center" title={logo.title}>
                    {logo.node}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2 · Presentación orientada a la ciudadanía */}
        <section id="problema" className="section-bleed bg-transparent py-16 sm:py-20 lg:py-24 border-t border-line/40">
          <div className="ed-max grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="max-w-xl space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">Información pública, más cerca</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight m-0 leading-[1.08]">
                Encontrar orientación <span className="text-brand">debería ser más sencillo.</span>
              </h2>
            </div>
            <div className="max-w-2xl space-y-4">
              <p className="text-base sm:text-lg text-muted leading-relaxed m-0">
                ChatAP reúne orientación sobre trámites, requisitos y servicios de la Administración Pública de Formosa en un espacio simple de consulta.
              </p>
              <p className="text-sm sm:text-base text-muted leading-relaxed m-0">
                Escribí tu duda con tus propias palabras y utilizá la información disponible para identificar los próximos pasos.
              </p>
            </div>
          </div>
        </section>

        {/* 3 · Cómo lo resolvemos */}
        <section id="solucion" className="section-bleed bg-transparent py-20 lg:py-24 border-t border-line/40">
          <div className="ed-max flex flex-col gap-12">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Cómo lo resolvemos
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Una forma más simple de orientarte.
              </h2>
              <p className="text-base text-muted m-0 leading-relaxed">
                Consultá en lenguaje cotidiano y encontrá orientación sobre información administrativa, requisitos y servicios públicos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BENEFITS.map((item) => (
                <div key={item.id} className="rounded-2xl border border-line bg-card/70 p-6 flex flex-col gap-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 border border-brand/15">
                    {item.icon}
                  </span>
                  <h3 className="text-lg font-bold text-ink tracking-tight m-0">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed m-0">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 · Presentación del asistente (Showcase Real y Directo) */}
        <section id="en-accion" className="section-bleed bg-transparent py-20 lg:py-28 border-t border-line/40">
          <div className="ed-max flex flex-col items-center gap-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Ejemplo ilustrativo
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Así puede comenzar una consulta.
              </h2>
              <p className="text-base text-muted m-0 leading-relaxed">
                Esta demostración es orientativa y muestra el formato de una conversación. Las respuestas reales dependen de la información disponible en el asistente.
              </p>
            </div>

            {/* Maqueta Interactiva Limpia y Enmarcada */}
            <div className="w-full max-w-4xl mx-auto">
              <InteractiveChatMockup />
            </div>

          </div>
        </section>

        {/* 5 · Preguntas frecuentes */}
        <section id="preguntas" className="section-bleed bg-transparent py-20 lg:py-24 border-t border-line/40">
          <div className="ed-max flex flex-col gap-10 max-w-3xl mx-auto">
            <div className="text-center space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Preguntas frecuentes
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Lo que necesitás saber antes de empezar.
              </h2>
              <p className="text-base text-muted m-0">
                Respuestas claras para consultar con tranquilidad.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openFaq === item.id;
                return (
                  <div key={item.id} className={`faq-item group ${isOpen ? "faq-item--open" : ""}`}>
                    <button id={`home-faq-question-${item.id}`} type="button" className="faq-summary" aria-expanded={isOpen} aria-controls={`home-faq-answer-${item.id}`} onClick={() => setOpenFaq(isOpen ? null : item.id)}>
                      <span className="text-base sm:text-lg font-bold text-ink">{item.question}</span>
                      <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div id={`home-faq-answer-${item.id}`} className="faq-content text-sm sm:text-base leading-relaxed text-muted" aria-hidden={!isOpen} role="region" aria-labelledby={`home-faq-question-${item.id}`}>
                      <div className="faq-content-inner"><p className="m-0">{item.answer}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7 · Cierre Tipográfico Minimalista */}
        <section id="cierre" className="section-bleed bg-transparent py-20 lg:py-28 border-t border-line/40">
          <div className="ed-max">
            <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
              <div className="p-2 rounded-2xl bg-brand/10 border border-brand/20">
                <ChatBotAvatar size={56} reaction="happy" followMouse={false} />
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink m-0">
                ¿Qué necesitás resolver hoy?
              </h2>

              <p className="text-base sm:text-lg text-muted max-w-xl leading-relaxed m-0">
                Escribí qué necesitás saber y comenzá una consulta sobre trámites y servicios públicos de Formosa.
              </p>

              <div className="flex flex-col items-center gap-3 pt-2">
                <Link
                  to="/chat"
                  onPointerEnter={prefetchChat}
                  className="btn-primary no-underline text-base font-bold normal-case tracking-normal px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-brand/25 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Consultar ahora</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link to="/login" className="text-xs font-semibold text-brand hover:underline no-underline">
                  ¿Ya tenés cuenta? Ingresá para retomar tus consultas.
                </Link>
              </div>

              <p className="text-xs text-muted/70 font-mono m-0">
                Información orientativa · Verificá los requisitos vigentes con el organismo correspondiente
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}