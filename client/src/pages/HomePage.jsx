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

const QUICK_PROMPTS = [
  {
    label: "¿Cómo solicito una licencia?",
    query: "¿Cómo solicito una licencia?",
  },
  {
    label: "¿Dónde veo mi recibo de sueldo?",
    query: "¿Dónde puedo ver mi recibo de sueldo?",
  },
  {
    label: "¿Cómo inicio mi jubilación?",
    query: "¿Cómo inicio mi trámite jubilatorio?",
  },
];

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
    description: "Gestión de cuentas, altas y accesos para ciudadanos y equipos internos.",
  },
  {
    id: "conocimiento",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Conocimiento actualizable",
    description: "El equipo administra trámites, requisitos y respuestas para mantener la información al día.",
  },
  {
    id: "integraciones",
    icon: (
      <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 015.656 0l1.414 1.414a4 4 0 01-5.656 5.656l-1.414-1.414m-3.656-3.656a4 4 0 00-5.656 0l-1.414 1.414a4 4 0 005.656 5.656l1.414-1.414" />
      </svg>
    ),
    title: "Integraciones en camino",
    description: "SIGED, MiPortal, WhatsApp y mesa de entradas para ampliar el alcance del servicio.",
  },
];

const FAQ_ITEMS = [
  {
    id: "alcance",
    question: "¿Qué puedo resolver con ChatAP?",
    answer: "ChatAP te orienta sobre trámites administrativos, responde preguntas frecuentes, te indica requisitos, documentos y puntos de atención, y te ayuda a preparar tu consulta. No reemplaza una resolución administrativa ni una notificación oficial.",
  },
  {
    id: "registro",
    question: "¿Necesito registrarme para consultar?",
    answer: "No. Podés consultar de forma libre y anónima en cualquier momento. Si iniciás sesión, tus conversaciones quedan guardadas para que puedas retomarlas más adelante.",
  },
  {
    id: "costo",
    question: "¿Tiene algún costo?",
    answer: "No. Es un servicio 100% gratuito, público y de libre acceso, desarrollado por el Gobierno de la Provincia de Formosa a través de la Subsecretaría de Recursos Humanos.",
  },
  {
    id: "tramites",
    question: "¿Cómo me guía paso a paso?",
    answer: "Escribí en lenguaje cotidiano qué necesitás resolver. ChatAP identifica el trámite y te indica requisitos, plazos y el organismo o mesa de entradas donde presentarlo.",
  },
  {
    id: "documentos",
    question: "¿Qué documentos o checklist puedo obtener?",
    answer: "ChatAP te indica qué formularios y modelos necesitás, dónde conseguirlos y qué pasos seguir. También podés descargar un checklist con los requisitos y formularios del trámite consultado.",
  },
  {
    id: "siged",
    question: "¿Qué pasa con el SIGED?",
    answer: "La integración con el SIGED forma parte del alcance del proyecto y está en camino. Por ahora, ChatAP te orienta sobre cómo consultar el estado de tu expediente y te indica dónde realizar la consulta.",
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
              Trámites, requisitos y documentos de la Administración Pública de Formosa, en una conversación clara. Para ciudadanos y agentes públicos, las 24 horas.
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

            <p className="hero-anim-sub hero-microcopy mt-4 m-0">
              Gratis · Sin registro · Disponible 24/7
            </p>

            {/* Consultas sugeridas: inician el chat automáticamente */}
            <div className="hero-anim-pills hero-quick-prompts mt-4" aria-label="Consultas sugeridas">
              {QUICK_PROMPTS.map((prompt) => (
                <Link
                  key={prompt.query}
                  to="/chat"
                  state={{ initialQuery: prompt.query }}
                  onPointerEnter={prefetchChat}
                  className="hero-quick-pill"
                >
                  {prompt.label}
                </Link>
              ))}
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

        {/* 2 · La problemática, resumida y directa */}
        <section id="problema" className="section-bleed bg-transparent py-20 lg:py-24 border-t border-line/40">
          <div className="ed-max flex flex-col items-center gap-7 text-center">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
              El punto de partida
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-ink tracking-tight m-0 leading-[1.1] max-w-3xl">
              Resolver una duda administrativa <span className="text-brand">no debería llevarte de un lugar a otro.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed m-0">
              Encontrar información pública no siempre es sencillo: a veces hay que repetir consultas, buscar el área correcta o trasladarse para obtener una orientación. Ciudadanos y agentes públicos necesitan información clara, confiable y fácil de encontrar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {["Consultas repetidas", "Derivaciones", "Traslados", "Información dispersa", "Falta de orientación clara"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-mist/70 dark:bg-neutral-800/70 border border-line/60 text-xs font-semibold text-muted"
                >
                  <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm font-bold text-brand m-0">ChatAP busca hacer ese recorrido más simple: reunir la información y acercar la orientación desde un solo lugar.</p>
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
                Una conversación para saber cómo seguir.
              </h2>
              <p className="text-base text-muted m-0 leading-relaxed">
                ChatAP reúne orientación, preguntas frecuentes y documentos institucionales en un
                solo lugar, para que ciudadanos y agentes públicos puedan avanzar sin perder tiempo
                en llamados, derivaciones o traslados.
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
                Demo interactiva
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Así puede ser una consulta en ChatAP.
              </h2>
              <p className="text-base text-muted m-0 leading-relaxed">
                Preguntá en lenguaje cotidiano y mirá cómo ChatAP arma la respuesta con requisitos,
                formularios y próximos pasos.
              </p>
            </div>

            {/* Maqueta Interactiva Limpia y Enmarcada */}
            <div className="w-full max-w-4xl mx-auto">
              <InteractiveChatMockup />
            </div>

            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <Link
                to="/chat"
                onPointerEnter={prefetchChat}
                className="btn-primary no-underline text-sm sm:text-base font-bold normal-case tracking-normal px-8 py-3.5 rounded-full inline-flex items-center gap-2 shadow-lg shadow-brand/20 transition-all"
              >
                <span>Consultar ahora</span>
                <span aria-hidden="true">→</span>
              </Link>
              <p className="text-xs text-muted m-0">La conversación que ves es ilustrativa. Iniciá una consulta para hablar con ChatAP.</p>
            </div>
          </div>
        </section>

        {/* 5 · Bonus: ecosistema y roadmap */}
        <section id="capacidades" className="section-bleed bg-transparent py-20 lg:py-28 border-t border-line/40">
          <div className="ed-max flex flex-col items-center gap-12">
            <div className="mx-auto max-w-3xl space-y-4 text-center">
              <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Más que un chat
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight m-0 leading-tight text-balance">
                Una plataforma que conecta orientación y gestión institucional.
              </h2>
              <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted m-0 leading-relaxed">
                ChatAP no es solo una conversación: es una plataforma para ordenar información
                institucional, administrar usuarios y preparar nuevas integraciones.
              </p>
            </div>

            <div className="grid w-full max-w-6xl grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
              {ECOSYSTEM.map((item) => (
                <div key={item.id} className="minimal-feature-card group h-full min-w-0">
                  <div className="flex flex-1 flex-col gap-5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mist dark:bg-neutral-800 border border-line">
                      {item.icon}
                    </span>
                    <div className="space-y-3">
                      <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight m-0 group-hover:text-brand transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted leading-relaxed m-0">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-card/60 px-4 py-2 text-xs font-semibold text-muted">
              <svg className="h-4 w-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              La valoración de las respuestas permite identificar oportunidades de mejora y seguir la calidad de la orientación.
            </p>
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
                    <button type="button" className="faq-summary" aria-expanded={isOpen} aria-controls={`home-faq-answer-${item.id}`} onClick={() => setOpenFaq(isOpen ? null : item.id)}>
                      <span className="text-base sm:text-lg font-bold text-ink">{item.question}</span>
                      <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div id={`home-faq-answer-${item.id}`} className="faq-content text-sm sm:text-base leading-relaxed text-muted" aria-hidden={!isOpen}>
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
                Escribí tu consulta y recibí orientación clara con información de la Subsecretaría
                de Recursos Humanos.
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