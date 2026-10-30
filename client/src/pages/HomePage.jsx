import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import LogoLoop from "../components/common/LogoLoop";
import InteractiveChatMockup from "../components/common/InteractiveChatMockup";
import ChatBotAvatar from "../components/ChatBotAvatar";
import HeroCinematicBackground from "../components/common/HeroCinematicBackground";
import ScrollFloat from "../components/common/ScrollFloat";
import useTheme from "../hooks/useTheme";

const Particles = lazy(() => import("../components/common/Particles"));

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
    title: "Orientación paso a paso",
    description: "Conocé los requisitos disponibles, la documentación necesaria y el área u organismo al que corresponde dirigirte.",
  },
  {
    id: "documentos",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Formularios y puntos de atención",
    description: "Identificá los formularios y documentos relacionados con tu consulta y prepará lo necesario antes de iniciar el trámite.",
  },
  {
    id: "acceso",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Disponible cuando lo necesitás",
    description: "Hacé tus consultas en lenguaje cotidiano, cuando lo necesites y sin tener que conocer términos administrativos.",
  },
];

const ECOSYSTEM = [
  {
    id: "usuarios",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "Panel de usuarios y permisos",
    description: "Una gestión ordenada de cuentas, perfiles y niveles de acceso para los equipos responsables de administrar ChatAP.",
  },
  {
    id: "conocimiento",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Conocimiento actualizado",
    description: "Un espacio para organizar y revisar contenidos, requisitos y respuestas, y mantener la orientación alineada con la información disponible.",
  },
  {
    id: "integraciones",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 015.656 0l1.414 1.414a4 4 0 01-5.656 5.656l-1.414-1.414m-3.656-3.656a4 4 0 00-5.656 0l-1.414 1.414a4 4 0 005.656 5.656l1.414-1.414" />
      </svg>
    ),
    title: "Integraciones en evolución",
    description: "La plataforma contempla futuras conexiones con servicios y sistemas de la Administración Pública para ampliar sus posibilidades de gestión.",
  },
];

const FAQ_ITEMS = [
  {
    id: "alcance",
    question: "¿Qué puedo consultar en ChatAP?",
    answer: "Podés hacer preguntas sobre trámites de la Administración Pública de Formosa. ChatAP puede orientarte con la descripción del trámite, sus requisitos, costos informados, lugares de presentación y documentos disponibles.",
  },
  {
    id: "registro",
    question: "¿Necesito crear una cuenta para hacer una consulta?",
    answer: "No. Podés consultar desde el chat sin registrarte ni iniciar sesión. La cuenta es opcional y permite acceder a las funciones habilitadas para usuarios registrados.",
  },
  {
    id: "informacion",
    question: "¿De dónde obtiene ChatAP sus respuestas?",
    answer: "ChatAP busca información en el catálogo de trámites que está publicado en la plataforma. Utiliza esos datos para responder y no debería completar con suposiciones requisitos, costos ni direcciones que no estén informados.",
  },
  {
    id: "aclaraciones",
    question: "¿Qué pasa si mi pregunta puede referirse a varios trámites?",
    answer: "Si encuentra más de una opción relacionada, ChatAP puede pedirte una aclaración para identificar cuál necesitás. Así puede orientar la respuesta hacia el trámite correcto.",
  },
  {
    id: "requisitos-costos",
    question: "¿Puede decirme cuáles son los requisitos y cuánto cuesta un trámite?",
    answer: "Sí, siempre que esos datos estén cargados en la ficha publicada del trámite. La respuesta puede incluir requisitos, dónde conseguirlos y los costos informados. Si un dato no figura, consultalo con el área responsable antes de iniciar el trámite.",
  },
  {
    id: "documentos",
    question: "¿Puedo encontrar y descargar formularios o documentos?",
    answer: "Cuando el trámite publicado tiene archivos adjuntos, ChatAP puede mostrar los documentos disponibles para que los consultes o descargues. Si no aparece un archivo, significa que no hay uno disponible en esa ficha.",
  },
  {
    id: "atencion",
    question: "¿ChatAP me indica dónde tengo que presentar la documentación?",
    answer: "Cuando la información está cargada para ese trámite, puede mostrarte la mesa de entrada asociada y sus datos de ubicación. Revisá esa información y confirmá con el área correspondiente si necesitás validar algún detalle antes de acercarte.",
  },
  {
    id: "limites",
    question: "¿ChatAP puede iniciar o resolver mi trámite?",
    answer: "No. ChatAP brinda orientación para que sepas cómo continuar, pero no presenta documentación, no gestiona expedientes ni reemplaza la atención o las decisiones del organismo responsable.",
  },
  {
    id: "sin-resultados",
    question: "¿Qué hago si ChatAP no encuentra información sobre mi consulta?",
    answer: "Probá explicar tu consulta con otras palabras o mencioná el nombre del trámite si lo conocés. Si aun así no aparece información, acercate o consultá directamente en una mesa de entrada.",
  },
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

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // El fondo WebGL solo anima mientras la sección principal está visible.
  const [heroVisible, setHeroVisible] = useState(true);
  useEffect(() => {
    const hero = document.getElementById("inicio");
    if (!hero || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const particleColors = useMemo(() => (
    theme === "light"
      ? ["#1E40AF", "#2563EB", "#0284C7", "#3B82F6", "#1D4ED8", "#0369A1"]
      : ["#FFFFFF", "#FFFFFF", "#93C5FD", "#60A5FA", "#38BDF8", "#BFDBFE"]
  ), [theme]);

  const institutionalLogos = useMemo(
    () => getInstitutionalLogos(theme === "dark"),
    [theme]
  );

  const prefetchChat = () => {
    import("./CiudadanoPage").catch(() => {});
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-sans relative selection:bg-brand selection:text-white">
      {/* Fondo de partículas WebGL: solo en pantallas grandes para no
          castigar el rendimiento de celulares y tablets. En móvil usamos
          un degradado estático equivalente. */}
      {isMobile ? (
        <div className="home-fallback-drift" aria-hidden="true" />
      ) : (
        <Suspense fallback={null}>
          <div className="home-particles-bg" aria-hidden="true">
            <Particles
              className="w-full h-full"
              particleColors={particleColors}
              particleCount={220}
              speed={0.05}
              particleBaseSize={16}
              active={heroVisible}
              moveParticlesOnHover
            />
          </div>
        </Suspense>
      )}

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
                El Estado te responde a la primera.
              </ScrollFloat>
            </div>

            {/* Subtítulo comercial y directo */}
            <p className="hero-anim-sub mt-6 text-base sm:text-lg lg:text-xl text-muted max-w-2xl mx-auto leading-relaxed m-0 font-normal">
              Encontrá orientación sobre trámites, requisitos y documentación de la Administración Pública de Formosa, en una conversación clara para ciudadanos y agentes públicos.
            </p>

            {/* Acción principal del banner */}
            <div className="hero-anim-cta hero-cta-group mt-8">
              <Link
                to="/chat"
                onPointerEnter={prefetchChat}
                className="btn-primary no-underline inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold normal-case tracking-normal shadow-lg shadow-brand/20 transition-all sm:text-base"
              >
                <span>Consultar ahora</span>
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href="#en-accion"
                className="hero-cta-secondary no-underline inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold normal-case tracking-normal transition-all sm:text-base"
              >
                <span>Ver cómo funciona</span>
                <span aria-hidden="true">↓</span>
              </a>
            </div>

            {/* Sellos de confianza institucionales */}
            <div className="hero-anim-trust flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 mt-8 text-xs text-muted font-medium select-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-mist/60 border border-line/40 backdrop-blur-sm shadow-xs">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Servicio oficial
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-mist/60 border border-line/40 backdrop-blur-sm shadow-xs">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                100% gratuito
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-mist/60 border border-line/40 backdrop-blur-sm shadow-xs">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sin registro obligatorio
              </span>
            </div>

          </div>
          <div className="hero-anim-footer hero-cinematic__footer relative z-10 w-full bg-transparent">
            <div className="ed-max flex flex-col items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted/70 font-semibold m-0 select-none">
                Un proyecto del Gobierno de la Provincia de Formosa
              </p>
              <LogoLoop
                logos={institutionalLogos}
                speed={26}
                direction="left"
                logoHeight={28}
                gap={56}
                fadeOut
                pauseOnHover
                scaleOnHover
                ariaLabel="Todos Unidos, Gobierno de Formosa y ChatAP"
              />
            </div>
          </div>
        </section>

        {/* 2 · El problema que ChatAP busca simplificar */}
        <section id="problema" className="section-bleed problem-section border-t border-line/40">
          <div className="ed-max problem-section__inner">
            <div className="problem-section__intro">
              <span className="problem-section__eyebrow">
                <span className="problem-section__eyebrow-line" aria-hidden="true" />
                El punto de partida
              </span>
              <h2 className="problem-section__title">
                Encontrar una respuesta <span>no debería ser otro trámite.</span>
              </h2>
              <p className="problem-section__lead">
                Cuando la información está dispersa o no queda claro dónde consultar, resolver una duda administrativa puede llevar más tiempo del necesario. Ciudadanos y agentes públicos necesitan orientación clara para saber cómo continuar.
              </p>
            </div>

            <div className="problem-section__list" aria-label="Dificultades frecuentes al buscar orientación administrativa">
              <article className="problem-card">
                <span className="problem-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>
                    <path d="M8 11h8M8 14h5"/>
                  </svg>
                </span>
                <div className="problem-card__copy">
                  <h3>Consultas repetidas</h3>
                  <p>Volver a explicar la misma situación sin encontrar una respuesta concreta.</p>
                </div>
              </article>

              <article className="problem-card">
                <span className="problem-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="2.5"/>
                    <circle cx="18" cy="18" r="2.5"/>
                    <path d="M8.5 6H13a3 3 0 0 1 3 3v6M15.5 18H11a3 3 0 0 1-3-3V9"/>
                  </svg>
                </span>
                <div className="problem-card__copy">
                  <h3>Derivaciones</h3>
                  <p>No tener claro qué área u organismo corresponde consultar.</p>
                </div>
              </article>

              <article className="problem-card">
                <span className="problem-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10.5 12 3l9 7.5"/>
                    <path d="M5.5 9.5V21h13V9.5M9 21v-6h6v6"/>
                    <path d="M12 6v.01"/>
                  </svg>
                </span>
                <div className="problem-card__copy">
                  <h3>Traslados innecesarios</h3>
                  <p>Acercarse a una oficina solo para averiguar dónde o cómo empezar.</p>
                </div>
              </article>

              <article className="problem-card">
                <span className="problem-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3.75h7l5 5V20a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2Z"/>
                    <path d="M14 4v5h5M8.5 13h7M8.5 16.5h7"/>
                  </svg>
                </span>
                <div className="problem-card__copy">
                  <h3>Información dispersa</h3>
                  <p>Buscar requisitos y documentación en distintas fuentes o lugares.</p>
                </div>
              </article>
            </div>

            <div className="problem-section__closing">
              <span className="problem-section__closing-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42"/>
                  <circle cx="12" cy="12" r="4"/>
                </svg>
              </span>
              <p><strong>ChatAP busca simplificar ese recorrido.</strong> Reúne orientación e información en un mismo espacio para ayudarte a encontrar respuestas y conocer los próximos pasos.</p>
            </div>
          </div>
        </section>

        {/* 3 · Cómo lo resolvemos */}
        <section id="solucion" className="section-bleed solution-section border-t border-line/40">
          <div className="ed-max solution-section__inner">
            <header className="solution-section__intro">
              <span className="solution-section__eyebrow">
                <span className="solution-section__eyebrow-mark" aria-hidden="true"><span /></span>
                Cómo lo resolvemos
              </span>
              <h2 className="solution-section__title">
                Una conversación para <span>saber cómo seguir.</span>
              </h2>
              <p className="solution-section__lead">
                ChatAP reúne orientación, preguntas frecuentes y documentación institucional para ayudarte a entender qué necesitás y cuál es el próximo paso, sin empezar la búsqueda desde cero.
              </p>
            </header>

            <div className="solution-section__grid" aria-label="Formas en las que ChatAP puede orientarte">
              {BENEFITS.map((item, index) => (
                <article key={item.id} className={`solution-card solution-card--${item.id}`} style={{ "--card-index": index }}>
                  <div className="solution-card__topline">
                    <span className="solution-card__number">0{index + 1}</span>
                    <span className="solution-card__icon" aria-hidden="true">{item.icon}</span>
                  </div>
                  <div className="solution-card__copy">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className="solution-card__accent" aria-hidden="true" />
                </article>
              ))}
            </div>

            <div className="solution-section__note">
              <span className="solution-section__note-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42"/><circle cx="12" cy="12" r="4"/></svg>
              </span>
              <p><strong>De la duda al próximo paso.</strong> Consultá con tus palabras y encontrá orientación en un mismo lugar.</p>
              <span className="solution-section__note-arrow" aria-hidden="true">↗</span>
            </div>
          </div>
        </section>
        {/* 4 · Presentación del asistente */}
        <section id="en-accion" className="section-bleed assistant-showcase border-t border-line/40">
          <div className="ed-max assistant-showcase__inner">
            <header className="assistant-showcase__intro">
              <span className="assistant-showcase__eyebrow">
                <span className="assistant-showcase__eyebrow-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42m-9.88 9.88-1.42 1.42"/><circle cx="12" cy="12" r="4"/></svg>
                </span>
                Demo interactiva
              </span>
              <h2 className="assistant-showcase__title">
                Así puede ser una consulta <span>en ChatAP.</span>
              </h2>
              <p className="assistant-showcase__lead">
                Conocé cómo una pregunta cotidiana puede convertirse en una orientación clara, con información útil y próximos pasos para continuar.
              </p>
            </header>

            <div className="assistant-showcase__stage">
              <div className="assistant-showcase__stage-glow" aria-hidden="true" />
              <div className="assistant-showcase__stage-label">
                <span className="assistant-showcase__live-dot" />
                Seguí el recorrido de una consulta
                <span className="assistant-showcase__label-tag">Experiencia interactiva</span>
              </div>
              <div className="assistant-showcase__mockup">
                <InteractiveChatMockup />
              </div>
            </div>

            <div className="assistant-showcase__action">
              <Link
                to="/chat"
                onPointerEnter={prefetchChat}
                className="assistant-showcase__cta btn-primary no-underline"
              >
                <span>Empezar una consulta</span>
                <span className="assistant-showcase__cta-icon" aria-hidden="true">↗</span>
              </Link>
              <span className="assistant-showcase__action-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></svg>
                Podés comenzar sin conocer términos administrativos.
              </span>
            </div>
          </div>
        </section>
        {/* 5 · Ecosistema institucional de ChatAP */}
        <section id="capacidades" className="section-bleed ecosystem-section border-t border-line/40">
          <div className="ed-max ecosystem-section__inner">
            <div className="ecosystem-section__intro">
              <span className="ecosystem-section__eyebrow">
                <span className="ecosystem-section__eyebrow-mark" aria-hidden="true" />
                Más que un chat
              </span>
              <h2 className="ecosystem-section__title">
                Una plataforma para <span>orientar mejor</span> y fortalecer la gestión institucional.
              </h2>
              <p className="ecosystem-section__lead">
                ChatAP reúne la orientación ciudadana y herramientas de gestión en una misma propuesta: información organizada, administración responsable y una evolución pensada para mejorar el servicio.
              </p>
            </div>

            <div className="ecosystem-section__grid">
              {ECOSYSTEM.map((item, index) => (
                <article key={item.id} className="ecosystem-card">
                  <div className="ecosystem-card__top">
                    <span className="ecosystem-card__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="ecosystem-card__index" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </div>
                  <div className="ecosystem-card__content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className="ecosystem-card__accent" aria-hidden="true" />
                </article>
              ))}
            </div>

            <div className="ecosystem-section__note">
              <span className="ecosystem-section__note-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.64 5.64l2.12 2.12m8.48 8.48 2.12 2.12m0-12.72-2.12 2.12m-8.48 8.48-2.12 2.12" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </span>
              <div>
                <span className="ecosystem-section__note-title">Mejora continua</span>
                <p>El proyecto contempla mecanismos de valoración para identificar oportunidades de mejora y seguir fortaleciendo la calidad de la orientación.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6 · Preguntas Frecuentes Concisas (FAQ) */}
        <section id="preguntas" className="section-bleed bg-transparent py-20 lg:py-24 border-t border-line/40">
          <div className="ed-max flex flex-col gap-10 max-w-3xl mx-auto">
            <div className="text-center space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Preguntas frecuentes
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Antes de empezar, algunas respuestas.
              </h2>
              <p className="text-base text-muted m-0">
                Conocé qué puede hacer ChatAP y cómo aprovecharlo.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openFaq === item.id;
                return (
                  <div key={item.id} className={`faq-item group ${isOpen ? "faq-item--open" : ""}`}>
                    <button type="button" id={`home-faq-trigger-${item.id}`} className="faq-summary" aria-expanded={isOpen} aria-controls={`home-faq-answer-${item.id}`} onClick={() => setOpenFaq(isOpen ? null : item.id)}>
                      <span className="text-base sm:text-lg font-bold text-ink">{item.question}</span>
                      <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div id={`home-faq-answer-${item.id}`} role="region" aria-labelledby={`home-faq-trigger-${item.id}`} className="faq-content text-sm sm:text-base leading-relaxed text-muted" aria-hidden={!isOpen}>
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
                Contanos qué necesitás resolver. ChatAP puede orientarte con información vinculada a trámites y servicios de la Subsecretaría de Recursos Humanos.
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
                <p className="text-xs font-semibold text-muted m-0">
                  Consultas en lenguaje cotidiano · Orientación clara
                </p>
                <Link to="/login" className="text-xs font-semibold text-brand hover:underline no-underline">
                  ¿Ya tenés cuenta? Ingresá para retomar tus consultas.
                </Link>
              </div>

              <p className="text-xs text-muted/70 font-mono m-0">
                Un servicio de orientación de la Subsecretaría de Recursos Humanos · Formosa
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}