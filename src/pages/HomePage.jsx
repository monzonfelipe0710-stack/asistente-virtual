import { lazy, Suspense, useMemo } from "react";
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

const FEATURES = [
  {
    id: "siged",
    icon: (
      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Seguimiento SIGED en vivo",
    description: "Ingresá el número de tu trámite y conocé al instante en qué despacho se encuentra, quién lo tiene y qué resolución espera.",
    badge: "Transparencia oficial",
  },
  {
    id: "docs",
    icon: (
      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Formularios y modelos en PDF",
    description: "Descargá directamente el Formulario F-04, modelos de notas de elevación y solicitudes validadas listas para presentar.",
    badge: "Validez provincial",
  },
  {
    id: "tiempo",
    icon: (
      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Atención 24/7 sin intermediarios",
    description: "Consultá en lenguaje cotidiano las 24 horas del día, los 365 días del año. Respuestas verificadas en menos de 3 segundos.",
    badge: "100% Gratuito",
  },
];

const SOLUTIONS = [
  {
    id: "orientacion",
    title: "Orientación y guía de trámites",
    description: "Guía interactiva de trámites administrativos y respuestas automáticas a las preguntas frecuentes de ciudadanos y empleados.",
  },
  {
    id: "documentos",
    title: "Documentos y plantillas al instante",
    description: "Acceso y descarga directa de documentos administrativos, modelos y plantillas oficiales listos para presentar.",
  },
  {
    id: "siged",
    title: "Integración con el SIGED",
    description: "Consultas vía API al Sistema de Gestión Documental existente para conocer el estado real de cada expediente en tiempo real.",
  },
];

const FAQ_ITEMS = [
  {
    id: "alcance",
    question: "¿Qué puedo resolver exactamente con ChatAP?",
    answer: "ChatAP te orienta en trámites administrativos, responde preguntas frecuentes, te entrega documentos, modelos y plantillas, y consulta el SIGED para informarte sobre tus expedientes. Además acompaña la atención de mesa de entradas.",
  },
  {
    id: "tramites",
    question: "¿Cómo me guía paso a paso en un trámite?",
    answer: "Escribí en lenguaje cotidiano qué necesitás resolver. ChatAP identifica el trámite y te indica requisitos, plazos y el organismo o mesa de entradas donde presentarlo, uno por uno.",
  },
  {
    id: "documentos",
    question: "¿Qué documentos, modelos y plantillas puedo descargar?",
    answer: "Formularios oficiales como el F-04 para justificación de licencias médicas, notas de elevación, declaraciones juradas y constancias oficiales: todos aprobados por la Subsecretaría y listos para presentar.",
  },
  {
    id: "siged",
    question: "¿Cómo funciona la integración con el SIGED?",
    answer: "Mediante una API, ChatAP consulta el Sistema de Gestión Documental existente. Con el número de tu expediente te informa su ubicación actual y último movimiento, sin trámites adicionales ni llamados.",
  },
  {
    id: "registro",
    question: "¿Necesito registrarme o iniciar sesión para consultar?",
    answer: "No es obligatorio: podés consultar de forma libre y anónima en cualquier momento. Si iniciás sesión, guardás el historial de tus conversaciones y el seguimiento de tus trámites.",
  },
  {
    id: "usuarios",
    question: "¿Qué incluyen el panel de usuarios y el de conocimiento?",
    answer: "El panel de usuarios permite gestionar cuentas, altas y permisos de ciudadanos y usuarios internos. El panel de conocimiento administra dinámicamente el dominio de conocimiento del chatbot, para que sus respuestas siempre estén actualizadas.",
  },
  {
    id: "integracion",
    question: "¿Qué hay de MiPortal, WhatsApp y la mesa de entradas?",
    answer: "La vinculación a MiPortal y eventuales funcionalidades por WhatsApp están contempladas como funcionalidades futuras del proyecto. El trabajo con las mesas de entrada se articula para formalizar correctamente cada circuito administrativo.",
  },
  {
    id: "costo",
    question: "¿Tiene algún costo utilizar ChatAP?",
    answer: "No. Es un servicio 100% gratuito, público y de libre acceso desarrollado por el Gobierno de la Provincia de Formosa a través de la Subsecretaría de Recursos Humanos, dependiente del Ministerio Jefatura de Gabinete.",
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

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
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
      {/* Fondo de Partículas WebGL sutil */}
      <Suspense fallback={null}>
        <div className="home-particles-bg" aria-hidden="true">
          <Particles
            className="w-full h-full"
            particleColors={particleColors}
            particleCount={isMobile ? 180 : 320}
            speed={0.05}
            particleBaseSize={16}
            moveParticlesOnHover
          />
        </div>
      </Suspense>

      <Navbar />

      <main id="contenido" className="flex-1 w-full relative z-10">
        {/* 1 · Hero Principal Minimalista y Directo */}
        {/* 1 · Hero Principal Cinematográfico y Editorial */}
        <section
          id="inicio"
          aria-label="Inicio ChatAP"
          className="hero-cinematic section-bleed relative flex flex-col justify-between min-h-[92svh] lg:min-h-screen"
        >
          {/* Layer 1 & 2: Fondo Cinematográfico con Ken Burns, Crossfade y Overlays */}
          <HeroCinematicBackground />

          <div className="ed-max hero-cinematic__inner relative z-10 flex flex-col items-center justify-center flex-1 w-full text-center px-4 pt-28 sm:pt-32 pb-10">
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

            {/* Subtítulo limpio y de alto contraste */}
            <p className="hero-anim-sub mt-6 text-base sm:text-lg lg:text-xl text-muted max-w-2xl mx-auto leading-relaxed m-0 font-normal">
              ChatAP es el asistente inteligente de la Subsecretaría de Recursos Humanos de Formosa: te orienta en tus trámites, responde tus preguntas frecuentes, te entrega documentos y consulta tus expedientes en el SIGED. Las 24 horas, sin filas ni traslados.
            </p>

            {/* Sellos de Confianza Institucionales */}
            <div className="hero-anim-trust flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 mt-10 text-xs text-muted font-medium select-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-mist/60 border border-line/40 backdrop-blur-sm shadow-xs">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                100% Gratuito y de libre acceso
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-mist/60 border border-line/40 backdrop-blur-sm shadow-xs">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Atención continua 24 horas
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-mist/60 border border-line/40 backdrop-blur-sm shadow-xs">
                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Subsecretaría de Recursos Humanos
              </span>
            </div>
          </div>

          {/* Marquesina institucional continua integrada */}
          <div className="hero-anim-footer hero-cinematic__footer relative z-10 w-full bg-transparent pb-6">
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
              Cada consulta administrativa te cuesta <span className="text-brand">tiempo que no recuperás.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed m-0">
              Los ciudadanos y los usuarios internos que necesitan una respuesta sobre trámites administrativos o documentos del gobierno siguen dependiendo de llamados, traslados y esperas. Cada gestión, lejos de un acceso rápido y eficiente.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {["Horas de espera", "Traslados innecesarios", "Formularios que no encontrás", "Expedientes sin novedades", "Consultas repetidas sin respuesta"].map((item) => (
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
          </div>
        </section>

        {/* 3 · Qué queremos resolver */}
        <section id="solucion" className="section-bleed bg-transparent py-20 lg:py-24 border-t border-line/40">
          <div className="ed-max flex flex-col gap-12">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Nuestro objetivo
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Acceso rápido y eficiente a información, trámites y documentos.
              </h2>
              <p className="text-base text-muted m-0 leading-relaxed">
                ChatAP es una plataforma conversacional inteligente que mejora la calidad de
                atención al ciudadano y a los usuarios internos, con respuestas automatizadas
                y conocimiento institucional de la Subsecretaría de Recursos Humanos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SOLUTIONS.map((item) => (
                <div key={item.id} className="rounded-2xl border border-line bg-card/70 p-6 flex flex-col gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} d="M5 13l4 4L19 7" />
                    </svg>
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
                Presentamos a ChatAP
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Una conversación, una respuesta oficial.
              </h2>
              <p className="text-base text-muted m-0 leading-relaxed">
                El asistente inteligente de la Administración Pública de Formosa: orienta sobre
                trámites, responde preguntas frecuentes, entrega documentos y consulta el SIGED
                en tiempo real, todo en una misma conversación.
              </p>
            </div>

            {/* Maqueta Interactiva Limpia y Enmarcada */}
            <div className="w-full max-w-4xl mx-auto">
              <InteractiveChatMockup />
            </div>

            <div className="text-center pt-2">
              <Link
                to="/chat"
                onPointerEnter={prefetchChat}
                className="btn-primary no-underline text-sm sm:text-base font-bold px-8 py-3.5 rounded-full inline-flex items-center gap-2 shadow-lg shadow-brand/20 transition-all"
              >
                <span>Abrir el asistente completo</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 5 · Funciones Clave */}
        <section id="capacidades" className="section-bleed bg-transparent py-20 lg:py-24 border-t border-line/40">
          <div className="ed-max flex flex-col gap-12">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Funciones clave
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Todo lo que ChatAP resuelve por vos.
              </h2>
              <p className="text-base text-muted m-0 leading-relaxed">
                Orientación, respuestas, documentos y consultas al SIGED, más el panel de usuarios y la gestión del conocimiento de la Subsecretaría de Recursos Humanos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((item) => (
                <div key={item.id} className="minimal-feature-card group">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-mist dark:bg-neutral-800 border border-line">
                        {item.icon}
                      </span>
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider font-semibold">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-ink tracking-tight m-0 group-hover:text-brand transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed m-0">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-line/60">
                    <Link
                      to="/chat"
                      onPointerEnter={prefetchChat}
                      className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 no-underline"
                    >
                      <span>Consultar ahora</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ))}
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
                Dudas comunes sobre el servicio
              </h2>
              <p className="text-base text-muted m-0">
                Todo lo que necesitás saber para utilizar ChatAP con total tranquilidad.
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {FAQ_ITEMS.map((item, idx) => (
                <details key={item.id} className="faq-item group" open={idx === 0}>
                  <summary className="faq-summary">
                    <span className="text-base sm:text-lg font-bold text-ink">{item.question}</span>
                    <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="faq-content text-sm sm:text-base leading-relaxed text-muted">
                    <p className="m-0">{item.answer}</p>
                  </div>
                </details>
              ))}
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
                ¿Tenés una consulta administrativa?
              </h2>

              <p className="text-base sm:text-lg text-muted max-w-xl leading-relaxed m-0">
                Comenzá en lenguaje cotidiano y obtené tu respuesta oficial de la provincia al instante.
              </p>

              <div className="pt-2">
                <Link
                  to="/chat"
                  onPointerEnter={prefetchChat}
                  className="btn-primary no-underline text-base font-bold px-9 py-4 rounded-full inline-flex items-center gap-2 shadow-xl shadow-brand/25 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Iniciar consulta con ChatAP</span>
                  <span>→</span>
                </Link>
              </div>

              <p className="text-xs text-muted/70 font-mono m-0">
                Servicio público oficial · Subsecretaría de Recursos Humanos · Ministerio Jefatura de Gabinete
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}