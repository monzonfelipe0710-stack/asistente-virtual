import { lazy, Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import LogoLoop from "../components/common/LogoLoop";
import ScrollFloat from "../components/common/ScrollFloat";
import ScrollReveal from "../components/common/ScrollReveal";
import BannerCarousel from "../components/common/BannerCarousel";
import InteractiveChatMockup from "../components/common/InteractiveChatMockup";
import { MetricStrip } from "../components/common/editorial";
import ChatBotAvatar from "../components/ChatBotAvatar";
import { Icon, ICONS } from "../components/profile/ui";
import useTheme from "../hooks/useTheme";

const Particles = lazy(() => import("../components/common/Particles"));

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------
   Datos Comerciales de HomePage
   ------------------------------------------------------------------ */

const HERO = {
  kicker: "ChatAP · Asistente Oficial 24/7 de Formosa",
  title: "La Administración Pública provincial, más fácil y al instante.",
  description:
    "Consultá trámites, descargá formularios oficiales y hacé el seguimiento de tus expedientes sin filas, demoras ni traslados innecesarios.",
  primary: { label: "Comenzar una consulta gratis", to: "/chat" },
  secondary: { label: "Ver cómo funciona", to: "#en-accion" },
};

const BANNER_SLIDES = [
  {
    id: "slide-consultas",
    kicker: "Innovación para el Ciudadano · Formosa",
    title: "Tus trámites resueltos desde cualquier lugar y a cualquier hora.",
    highlight: "Orientación ágil sobre trámites provinciales, modelos de notas y normativas oficiales.",
  },
  {
    id: "slide-expedientes",
    kicker: "Seguimiento en Tiempo Real · SIGED",
    title: "Conocé el estado de tus gestiones sin intermediarios.",
    highlight: "Rastreo transparente de expedientes, licencias oficiales y circuito de Mesa de Entradas.",
  },
  {
    id: "slide-atencion",
    kicker: "Disponibilidad Total 24 Horas",
    title: "Respuestas claras en lenguaje cotidiano, en menos de 3 segundos.",
    highlight: "Información verificada por la Subsecretaría de Recursos Humanos y el Instituto Politécnico Formosa.",
  },
];

const HERO_PROMPTS = [
  { label: "📄 Formulario F-04", query: "Necesito el Formulario F-04 para solicitar licencia" },
  { label: "🔍 Estado de Expediente", query: "¿Cómo consultar el estado de mi expediente en SIGED?" },
  { label: "🏥 Licencia Médica", query: "¿Cuáles son los requisitos y plazos para justificar una licencia médica?" },
  { label: "🏛️ Mesa de Entradas", query: "¿Dónde queda la Mesa General de Entradas y cuáles son sus horarios de atención?" },
  { label: "💼 Certificado de Servicios", query: "¿Cómo tramito mi certificado de servicios y aportes provinciales?" },
];

const COMMERCIAL_METRICS = [
  { label: "Resolución en primer contacto", value: "+98%" },
  { label: "Tiempo promedio de respuesta", value: "< 3s" },
  { label: "Disponibilidad ininterrumpida", value: "24/7" },
];

const ACTION = {
  kicker: "ChatAP en acción",
  title: "Una consulta, una respuesta, un trámite resuelto",
  lead: "Mirá cómo interactúa el asistente en tiempo real: comprende tu duda, busca la normativa oficial y te entrega la solución inmediata.",
  steps: [
    {
      id: "consulta",
      label: "1. Consultás en lenguaje simple",
      text: "Escribís tu consulta como si hablaras con una persona, sin necesidad de conocer términos jurídicos complejos.",
    },
    {
      id: "respuesta",
      label: "2. ChatAP responde al instante",
      text: "El asistente analiza la base de conocimiento oficial de la provincia y te entrega la información verificada.",
    },
    {
      id: "siguiente",
      label: "3. Descargás o avanzás tu gestión",
      text: "Descargás el formulario en PDF, verificás el estado de tu expediente o conocés los requisitos exactos para presentar.",
    },
  ],
};

const COMPARISON_DATA = {
  traditional: [
    "Madrugar y hacer largas filas presenciales en dependencias públicas.",
    "Horarios limitados y estrictos de atención (ej. 7:00 a 13:00 hs).",
    "Gastos y demoras en traslados solo para averiguar requisitos básicos.",
    "Incertidumbre sobre qué fotocopias o documentación precisa llevar.",
    "Falta de visibilidad sobre en qué oficina se encuentra un expediente.",
  ],
  chatap: [
    "Consultas resueltas en segundos desde tu teléfono o computadora.",
    "Atención ininterrumpida las 24 horas del día, los 365 días del año.",
    "Cero traslados: descarga directa de formularios oficiales a tu pantalla.",
    "Lista de verificación clara con los requisitos exactos de cada trámite.",
    "Rastreo en tiempo real del estado de tu gestión en el sistema SIGED.",
  ],
};

const TESTIMONIALS = [
  {
    id: "t1",
    name: "Prof. Laura Benítez",
    role: "Docente Provincial",
    locality: "Formosa Capital",
    text: "Tenía que justificar una licencia médica urgente. Le consulté a ChatAP a las diez de la noche y en un instante me explicó los plazos y me descargó el Formulario F-04 sin tener que pedir permiso en la escuela.",
    initials: "LB",
    badgeBg: "bg-blue-600",
  },
  {
    id: "t2",
    name: "Martín Insfrán",
    role: "Personal de Administración",
    locality: "Clorinda",
    text: "El seguimiento de expedientes es impecable. Puse el número de mi trámite y me indicó en segundos en qué oficina de Personal se encontraba y qué paso restaba para la resolución.",
    initials: "MI",
    badgeBg: "bg-indigo-600",
  },
  {
    id: "t3",
    name: "Silvia Gómez",
    role: "Vecina y Contribuyente",
    locality: "Pirané",
    text: "Viajar a la capital solo para averiguar qué papeles presentar era un costo y un tiempo enormes. Con ChatAP averigüé todo desde mi celular y fui directamente con la carpeta lista a Mesa de Entradas.",
    initials: "SG",
    badgeBg: "bg-emerald-600",
  },
];

const FAQ_ITEMS = [
  {
    id: "faq-costo",
    question: "¿Tiene algún costo utilizar el asistente ChatAP?",
    answer:
      "No, es un servicio 100% gratuito, público y de libre acceso desarrollado por el Gobierno de la Provincia de Formosa a través de la Subsecretaría de Recursos Humanos y el Instituto Politécnico Formosa para toda la comunidad.",
  },
  {
    id: "faq-registro",
    question: "¿Es obligatorio registrarse para hacer una consulta?",
    answer:
      "No es obligatorio. Podés ingresar y consultar libremente de forma anónima en cualquier momento. Si decidís iniciar sesión con tu cuenta provincial, podrás acceder a un historial unificado y al seguimiento guardado de tus gestiones.",
  },
  {
    id: "faq-documentacion",
    question: "¿Qué formularios oficiales puedo descargar directamente?",
    answer:
      "Podés solicitar y descargar plantillas oficiales en PDF como el Formulario F-04 para licencias médicas, notas de elevación, certificados de servicios y constancias de Mesa de Entradas con un solo clic en la conversación.",
  },
  {
    id: "faq-siged",
    question: "¿Cómo funciona el rastreo de expedientes por SIGED?",
    answer:
      "Simplemente ingresá el número de tu expediente o actuación en el chat. ChatAP consulta el Sistema de Gestión Documental y te informa en qué dependencia se encuentra, su estado y el último movimiento registrado.",
  },
  {
    id: "faq-oficinas",
    question: "¿Qué ocurre si mi trámite requiere presentación presencial?",
    answer:
      "El asistente te informará la oficina competente, su dirección física exacta (ej. Casa de Gobierno, Mesa General de Entradas, Ministerio correspondiente), los horarios de atención y el teléfono de contacto oficial para evitar viajes en vano.",
  },
];

const FINAL_CTA = {
  kicker: "Atención Ciudadana Inmediata",
  title: "¿Tenés una consulta administrativa? Resolvela con ChatAP hoy.",
  lead: "Unite a los miles de formoseños que ahorran tiempo, evitan filas y gestionan sus trámites con total transparencia y rapidez.",
  primary: { label: "Comenzar una consulta gratis", to: "/chat" },
};

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

/* ------------------------------------------------------------------
   Componente Principal
   ------------------------------------------------------------------ */

export default function HomePage() {
  const heroRef = useRef(null);
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

  /* Precarga el chunk del chat cuando el usuario apunta a un enlace hacia /chat */
  const prefetchChat = () => {
    import("../pages/CiudadanoPage").catch(() => {});
  };

  useLayoutEffect(() => {
    const hero = heroRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hero || reducedMotion) return undefined;

    const context = gsap.context(() => {
      gsap.fromTo(
        ".hero-cinematic__kicker",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.2 },
      );
    }, hero);

    return () => {
      context.revert();
    };
  }, []);

  /* Ambientación general: animación fluida de entrada por hardware una sola vez */
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;

    const blocks = gsap.utils.toArray("[data-reveal]");
    if (!blocks.length) return undefined;

    const context = gsap.context(() => {
      blocks.forEach((block) => {
        gsap.fromTo(
          block,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: {
              trigger: block,
              start: "top 88%",
              toggleActions: "play none none none",
              once: true,
            },
          }
        );
      });
    });

    return () => context.revert();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink relative">
      {/* ── Fondo de Partículas WebGL (OGL) para toda la página de inicio ── */}
      <Suspense fallback={null}>
        <div className="home-particles-bg" aria-hidden="true">
          <Particles
            className="w-full h-full"
            particleColors={particleColors}
            particleCount={isMobile ? 220 : 380}
            speed={0.06}
            particleBaseSize={18}
            moveParticlesOnHover
          />
        </div>
      </Suspense>

      <Navbar />

      <main id="contenido" className="flex-1 w-full relative z-10">

        {/* 1 · Hero Principal de Alta Conversión */}
        <section ref={heroRef} id="inicio" aria-label="Inicio ChatAP" className="hero-cinematic section-bleed relative flex flex-col justify-between min-h-screen min-h-[100svh]">
          <div className="hero-cinematic__overlay" aria-hidden="true" />

          {/* Carrusel del Banner Hero con CTAs y Píldoras de Consulta Rápida */}
          <div className="ed-max hero-cinematic__inner relative z-10 flex flex-col items-center justify-center flex-1 w-full pt-24 sm:pt-28 pb-8">
            <BannerCarousel slides={BANNER_SLIDES} autoPlayInterval={5500} />

            {/* CTAs Comerciales de Impacto */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 mt-6 z-20">
              <Link
                to={HERO.primary.to}
                onPointerEnter={prefetchChat}
                className="btn-primary no-underline shadow-xl shadow-brand/25 text-sm sm:text-base px-7 sm:px-9 py-3.5 flex items-center gap-2.5 font-bold group transform hover:-translate-y-0.5 transition-all"
              >
                <span>{HERO.primary.label}</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <a
                href={HERO.secondary.to}
                className="btn-ghost no-underline text-ink border-line hover:bg-mist/60 text-sm sm:text-base px-6 py-3.5 font-semibold"
              >
                {HERO.secondary.label}
              </a>
            </div>

            {/* Píldoras interactivas de inicio rápido con 1 clic */}
            <div className="mt-6 flex flex-col items-center gap-2.5 w-full z-20">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted/70 font-semibold select-none">
                Consultas frecuentes con 1 clic:
              </span>
              <div className="hero-quick-prompts">
                {HERO_PROMPTS.map((item) => (
                  <Link
                    key={item.label}
                    to="/chat"
                    state={{ initialQuery: item.query }}
                    onPointerEnter={prefetchChat}
                    className="hero-quick-pill group"
                    title={`Consultar: ${item.query}`}
                  >
                    <span>{item.label}</span>
                    <span className="opacity-40 group-hover:opacity-100 transition-opacity text-brand font-bold">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sellos de Confianza Comercial (Trust Badges) */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-5 text-[11px] sm:text-xs text-muted font-medium select-none z-20">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                100% Gratuito y oficial
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Atención 24/7 sin filas ni esperas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Validado por la Administración Provincial
              </span>
            </div>
          </div>

          {/* Banda institucional · Marquesina simétrica y continua */}
          <div className="hero-cinematic__footer relative z-10 w-full bg-transparent pb-4">
            <div className="ed-max flex flex-col items-center gap-2">
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-muted/75 font-semibold m-0 select-none">
                Un proyecto hecho en Formosa
              </p>
              <LogoLoop
                logos={institutionalLogos}
                speed={26}
                direction="left"
                logoHeight={28}
                gap={54}
                fadeOut
                pauseOnHover
                scaleOnHover
                ariaLabel="Todos Unidos, Gobierno de Formosa y ChatAP"
              />
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-widest text-muted/60 mt-1 select-none">
                <span>Deslizá para explorar</span>
                <span className="animate-bounce" aria-hidden="true">↓</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2 · Bento Grid Comercial: Plataforma Tecnológica de ChatAP */}
        <section id="que-es" aria-label="Soluciones y Bento Grid" className="section-bleed bg-transparent py-16 md:py-24 border-b border-line/40">
          <div className="ed-max flex flex-col gap-12 md:gap-16">
            
            {/* Métricas clave comerciales directas */}
            <div className="w-full">
              <MetricStrip items={COMMERCIAL_METRICS} cols="grid-cols-1 sm:grid-cols-3" />
            </div>

            {/* Cabecera de la sección con ScrollReveal */}
            <div className="flex flex-col items-start gap-5 max-w-4xl pt-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-brand">
                <span className="h-2 w-2 rounded-full bg-brand animate-pulse" aria-hidden="true" />
                Soluciones Digitales · Provincia de Formosa
              </span>

              <ScrollReveal
                baseOpacity={0.18}
                containerClassName="w-full"
                textClassName="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink leading-[1.2]"
              >
                Menos burocracia, más agilidad. Diseñado para simplificar gestiones públicas desde tu casa o trabajo.
              </ScrollReveal>

              <p className="m-0 text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
                ChatAP centraliza los requisitos, modelos de notas y el estado de tus trámites en una sola interfaz inteligente disponible los 365 días del año.
              </p>
            </div>

            {/* ── BENTO GRID COMERCIAL INTERACTIVO ── */}
            <div data-reveal className="bento-grid w-full pt-4">

              {/* Bento Card 1: Visor Documental en Vivo (7 cols) */}
              <div className="bento-card col-span-12 lg:col-span-7">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-xs font-mono font-bold text-brand uppercase tracking-wider">
                      <span className="h-2 w-2 rounded-full bg-brand" />
                      Inteligencia Documental
                    </span>
                    <span className="text-[11px] font-mono text-muted bg-mist/80 px-2.5 py-0.5 rounded-full border border-line">
                      Oficial PDF
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-ink m-0 tracking-tight">
                    Descarga directa de formularios y modelos oficiales
                  </h3>
                  <p className="text-sm text-muted leading-relaxed m-0">
                    Olvidate de fotocopias borrosas o modelos desactualizados. Solicitá el formulario en la conversación y descargalo en formato listo para imprimir o presentar digitalmente.
                  </p>
                </div>

                {/* Micro-UI interactiva de formulario */}
                <div className="mt-6 rounded-xl border border-line bg-paper/90 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line/60">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-600 font-bold text-xs">
                        PDF
                      </span>
                      <div>
                        <p className="text-xs font-bold text-ink m-0">Formulario F-04 Oficial</p>
                        <p className="text-[10px] text-muted m-0">Solicitud de Licencia Médica · Subsecretaría de RRHH</p>
                      </div>
                    </div>
                    <Link
                      to="/chat"
                      state={{ initialQuery: "Necesito descargar el Formulario F-04 para licencia médica" }}
                      onPointerEnter={prefetchChat}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 hover:bg-brand hover:text-white px-3 py-1.5 rounded-lg transition-colors no-underline"
                    >
                      <span>Descargar en el chat</span>
                      <span>↓</span>
                    </Link>
                  </div>
                  <div className="pt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted font-medium">
                    <span className="bg-mist/70 px-2 py-0.5 rounded">✓ Con campos guiados</span>
                    <span className="bg-mist/70 px-2 py-0.5 rounded">✓ Válido en toda la provincia</span>
                    <span className="bg-mist/70 px-2 py-0.5 rounded">✓ Actualizado 2026</span>
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Radar de Expedientes SIGED (5 cols) */}
              <div className="bento-card col-span-12 lg:col-span-5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      Integración SIGED en Vivo
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-bold">
                      En línea
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-ink m-0 tracking-tight">
                    Seguimiento transparente de expedientes
                  </h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed m-0">
                    Ingresá el número de tu actuación y conocé en qué despacho se encuentra, quién lo tiene y qué resolución espera.
                  </p>
                </div>

                {/* Micro-UI: Estado SIGED en tiempo real */}
                <div className="mt-5 rounded-xl border border-line bg-paper/90 p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-ink">EXP-2026-04829/FS</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      En despacho final
                    </span>
                  </div>

                  {/* Indicador de pasos */}
                  <div className="siged-step-indicator py-2">
                    <div className="relative z-10 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      ✓
                    </div>
                    <div className="relative z-10 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      ✓
                    </div>
                    <div className="relative z-10 grid h-6 w-6 place-items-center rounded-full bg-brand text-white text-[10px] font-bold animate-pulse">
                      3
                    </div>
                    <div className="relative z-10 grid h-6 w-6 place-items-center rounded-full bg-mist border border-line text-muted text-[10px] font-bold">
                      4
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                    <span>Mesa Entrada</span>
                    <span>Dictamen</span>
                    <span className="font-bold text-brand">Dir. Personal</span>
                    <span>Retiro</span>
                  </div>
                </div>
              </div>

              {/* Bento Card 3: Wizard de Pasos Guiados (4 cols) */}
              <div className="bento-card col-span-12 md:col-span-4">
                <div className="flex flex-col gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Icon path={ICONS.tramite} className="h-5 w-5" />
                  </span>
                  <h4 className="text-lg font-bold text-ink m-0">Asistente por Pasos</h4>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed m-0">
                    Te guía con preguntas simples para que sepas qué presentar y cómo armar tu expediente sin equivocarte.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 flex flex-col gap-1.5 text-xs text-muted font-medium">
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-brand font-bold">✓</span> Requisitos claros y ordenados
                  </span>
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-brand font-bold">✓</span> Validación de plazos legales
                  </span>
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-brand font-bold">✓</span> Chips con respuestas listas
                  </span>
                </div>
              </div>

              {/* Bento Card 4: Directorio de Oficinas y Sedes (4 cols) */}
              <div className="bento-card col-span-12 md:col-span-4">
                <div className="flex flex-col gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                    <Icon path={ICONS.activity} className="h-5 w-5" />
                  </span>
                  <h4 className="text-lg font-bold text-ink m-0">Directorio Oficial y Sedes</h4>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed m-0">
                    Ubicación exacta, teléfonos de mesa de ayuda y horarios presenciales de Casa de Gobierno y ministerios.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 flex flex-col gap-1.5 text-xs text-muted font-medium">
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-blue-500 font-bold">📍</span> Belgrano 878 · Casa de Gobierno
                  </span>
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-blue-500 font-bold">🕒</span> Horario oficial: 07:00 a 13:00 hs
                  </span>
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-blue-500 font-bold">📞</span> Líneas de contacto directo
                  </span>
                </div>
              </div>

              {/* Bento Card 5: Inteligencia Artificial Cotidiana (4 cols) */}
              <div className="bento-card col-span-12 md:col-span-4">
                <div className="flex flex-col gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                    <Icon path={ICONS.chat} className="h-5 w-5" />
                  </span>
                  <h4 className="text-lg font-bold text-ink m-0">Lenguaje Simple y Cercano</h4>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed m-0">
                    Preguntá como hablás todos los días. ChatAP comprende tu necesidad sin tecnicismos ni trabas burocráticas.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/60 flex flex-col gap-1.5 text-xs text-muted font-medium">
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-emerald-500 font-bold">💬</span> Comprensión natural instantánea
                  </span>
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-emerald-500 font-bold">🛡️</span> Respuestas seguras y oficiales
                  </span>
                  <span className="flex items-center gap-1.5 text-ink">
                    <span className="text-emerald-500 font-bold">⚡</span> Menos de 3 segundos por respuesta
                  </span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 3 · Demostración en Vivo: ChatAP en Acción */}
        <section id="en-accion" className="section-bleed bg-transparent">
          <div className="ed-max py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Columna Izquierda: Información y pasos */}
            <div data-reveal className="flex flex-col gap-10 lg:pr-6 order-1">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-brand">
                  Demostración Interactiva
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                  {ACTION.title}
                </h2>
                <p className="text-base leading-relaxed text-muted m-0">
                  {ACTION.lead}
                </p>
              </div>

              <ol className="m-0 p-0 list-none flex flex-col gap-6">
                {ACTION.steps.map((s) => (
                  <li key={s.id} className="flex gap-4 items-start">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-white text-xs font-bold" aria-hidden="true">
                      ✓
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="m-0 text-sm font-bold text-ink uppercase tracking-wide">{s.label}</p>
                      <p className="m-0 text-xs sm:text-sm leading-relaxed text-muted">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div>
                <Link
                  to="/chat"
                  onPointerEnter={prefetchChat}
                  className="btn-primary no-underline text-sm px-6 py-3 shadow-md shadow-brand/20 inline-flex items-center gap-2 font-bold group"
                >
                  <span>Probar una consulta real ahora</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Columna Derecha: Simulación fluida de conversación interactiva */}
            <div data-reveal className="order-2 w-full">
              <InteractiveChatMockup />
            </div>
          </div>
        </section>

        {/* 4 · Comparativa Comercial: "Trámite Tradicional vs Con ChatAP" */}
        <section id="comparativa" className="section-bleed bg-transparent py-16 md:py-24 border-y border-line/40">
          <div className="ed-max flex flex-col gap-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Transformación Digital
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                ¿Por qué cambiar la forma de hacer trámites?
              </h2>
              <p className="text-base text-muted m-0">
                Compará la experiencia analógica tradicional frente a la inmediatez y comodidad de gestionar con ChatAP.
              </p>
            </div>

            <div data-reveal className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Tarjeta Tradicional (Negativa / Pasada) */}
              <div className="comparison-card-bad flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-red-500/20 mb-5">
                    <span className="font-bold text-red-600 dark:text-red-400 text-lg flex items-center gap-2">
                      <span>✕</span> Trámite Tradicional
                    </span>
                    <span className="text-xs font-mono text-red-600/80 uppercase font-semibold">Antes</span>
                  </div>
                  <ul className="space-y-4 m-0 p-0 list-none text-sm text-muted">
                    {COMPARISON_DATA.traditional.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-red-500 font-bold shrink-0 mt-0.5">✕</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 font-semibold mt-6 pt-4 border-t border-red-500/10 m-0">
                  Horas perdidas en colas y viajes innecesarios.
                </p>
              </div>

              {/* Tarjeta Con ChatAP (Positiva / Futuro Inmediato) */}
              <div className="comparison-card-good flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-brand/20 mb-5">
                    <span className="font-bold text-brand text-lg flex items-center gap-2">
                      <span>✓</span> Con ChatAP
                    </span>
                    <span className="text-xs font-mono text-brand font-bold bg-brand/10 px-2.5 py-0.5 rounded-full uppercase">
                      Presente Digital
                    </span>
                  </div>
                  <ul className="space-y-4 m-0 p-0 list-none text-sm text-ink font-medium">
                    {COMPARISON_DATA.chatap.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-brand/10 flex items-center justify-between">
                  <p className="text-xs text-brand font-bold m-0">
                    Resolución ágil en menos de 3 minutos.
                  </p>
                  <Link
                    to="/chat"
                    onPointerEnter={prefetchChat}
                    className="text-xs font-bold text-brand hover:underline no-underline"
                  >
                    Comprobalo ahora →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 · Prueba Social: Experiencias y Testimonios */}
        <section id="testimonios" className="section-bleed bg-transparent py-16 md:py-24">
          <div className="ed-max flex flex-col gap-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Experiencias Ciudadanas
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Lo que dicen quienes ya lo usan
              </h2>
              <p className="text-base text-muted m-0">
                Miles de formoseños ya resolvieron sus consultas sin perder tiempo.
              </p>
            </div>

            <div data-reveal className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div key={t.id} className="testimonial-card">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                      {"★".repeat(5)}
                    </div>
                    <p className="text-sm text-ink leading-relaxed m-0 italic">
                      "{t.text}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-line/50">
                    <span className={`grid h-9 w-9 place-items-center rounded-full text-white font-bold text-xs ${t.badgeBg}`}>
                      {t.initials}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink m-0">{t.name}</p>
                      <p className="text-[11px] text-muted m-0">{t.role} · {t.locality}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 · Acordeón Comercial de Preguntas Frecuentes (FAQ) */}
        <section id="preguntas-frecuentes" className="section-bleed bg-transparent py-16 md:py-24 border-t border-line/40">
          <div className="ed-max flex flex-col gap-10 max-w-4xl mx-auto">
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-mono font-bold uppercase tracking-wider text-brand">
                Dudas Comunes
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight m-0">
                Preguntas frecuentes sobre ChatAP
              </h2>
              <p className="text-base text-muted m-0">
                Todo lo que necesitás saber para comenzar a consultar con total tranquilidad y seguridad.
              </p>
            </div>

            <div data-reveal className="flex flex-col gap-3.5 w-full">
              {FAQ_ITEMS.map((item, idx) => (
                <details key={item.id} className="faq-item group" open={idx === 0}>
                  <summary className="faq-summary">
                    <span>{item.question}</span>
                    <svg className="faq-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="faq-content">
                    <p className="m-0">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 7 · CTA Final de Alta Conversión */}
        <section id="cta" className="section-bleed bg-transparent py-16 md:py-24">
          <div className="ed-max">
            <div className="cta-cinematic rounded-3xl text-paper p-8 md:p-16 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden">
              <div className="mb-2">
                <ChatBotAvatar size={80} reaction="happy" followMouse={false} />
              </div>

              <p className="m-0 font-mono tracking-[0.22em] text-xs font-semibold uppercase text-brand">
                {FINAL_CTA.kicker}
              </p>

              <ScrollFloat
                as="h2"
                mode="once"
                containerClassName="m-0 text-3xl font-extrabold tracking-tight text-paper md:text-5xl font-neue max-w-3xl"
                animationDuration={0.8}
                ease="back.inOut(1.7)"
                stagger={0.03}
                scrollStart="center bottom+=30%"
                scrollEnd="bottom bottom-=25%"
              >
                {FINAL_CTA.title}
              </ScrollFloat>

              <p className="m-0 max-w-2xl text-base leading-relaxed text-paper/75 md:text-lg">
                {FINAL_CTA.lead}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  to={FINAL_CTA.primary.to}
                  onPointerEnter={prefetchChat}
                  className="btn-primary no-underline text-base px-8 py-4 shadow-xl shadow-brand/35 font-bold flex items-center gap-2 transform hover:scale-105 transition-all"
                >
                  <span>{FINAL_CTA.primary.label}</span>
                  <span>→</span>
                </Link>
              </div>

              <p className="text-xs text-paper/50 m-0 pt-2 font-mono">
                Sin descargas · 100% Gratuito · Compatible con celulares, tablets y computadoras
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}