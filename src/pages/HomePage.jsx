import { lazy, Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import LogoLoop from "../components/common/LogoLoop";
import ScrollFloat from "../components/common/ScrollFloat";
import { Kicker, DisplayTitle, Lead, MetricStrip } from "../components/common/editorial";
import ChatBotAvatar from "../components/ChatBotAvatar";
import { Icon, ICONS } from "../components/profile/ui";
import useTheme from "../hooks/useTheme";

const CRTWarp = lazy(() => import("../components/common/CRTWarp"));

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------
   Datos del Home · editá acá los textos (no en el JSX).
   ------------------------------------------------------------------ */

const HERO = {
  kicker: "ChatAP · Asistente virtual de la Administración Pública",
  title: "La administración pública más fácil de consultar.",
  description:
    "ChatAP te orienta sobre trámites, documentación y servicios de la provincia. Escribí tu consulta y obtené una respuesta clara, al momento y en lenguaje cotidiano.",
  primary: { label: "Comenzar una consulta", to: "/chat" },
  secondary: { label: "Conocer ChatAP", to: "#que-es" },
};

const ABOUT = {
  kicker: "Qué es ChatAP",
  title: "Un asistente que acerca la Administración al ciudadano",
  paragraphs: [
    "ChatAP es un asistente inteligente que facilita la interacción entre las personas y la Administración Pública de la Provincia de Formosa.",
    "Está pensado para quienes necesitan consultar trámites, presentar documentación o encontrar el camino correcto dentro de organismos gubernamentales, sin esperar en filas ni depender de horarios.",
  ],
  numbers: [
    { label: "Temas de conocimiento", value: "16" },
    { label: "Documentos y plantillas", value: "15" },
    { label: "Oficinas orientadas", value: "4" },
  ],
};

const ACTION = {
  kicker: "ChatAP en acción",
  title: "Una consulta, una respuesta, un siguiente paso",
  lead: "Así se ve una conversación real: el asistente entiende qué necesitás, te orienta y te deja listo para continuar el trámite.",
  steps: [
    {
      id: "consulta",
      label: "Consultás",
      text: "Escribís tu pregunta con tus palabras, como se la harías a una persona.",
    },
    {
      id: "respuesta",
      label: "ChatAP responde",
      text: "El asistente te orienta con información clara y verificada del organismo.",
    },
    {
      id: "siguiente",
      label: "Siguiente paso",
      text: "Descargás, derivás o seguís el trámite por el canal correspondiente.",
    },
  ],
};

const CHATAP_CAPABILITIES = [
  {
    id: "informacion",
    icon: ICONS.chat,
    title: "Consultar información",
    text: "Responde dudas sobre haberes, licencias, trámites, legajos y más, con la base de conocimiento actualizada de la Administración.",
  },
  {
    id: "tramites",
    icon: ICONS.tramite,
    title: "Orientar sobre trámites",
    text: "Guía paso a paso en trámites como licencias y expedientes, indicando requisitos y documentación.",
  },
  {
    id: "consultas-frecuentes",
    icon: ICONS.activity,
    title: "Resolver consultas frecuentes",
    text: "Atiende las preguntas más comunes: recibos de sueldo, expedientes, permisos y descargas de formularios.",
  },
  {
    id: "camino",
    icon: ICONS.bell,
    title: "Encontrar el camino correcto",
    text: "Cuando la consulta lo requiere, deriva a la oficina correspondiente o al canal de soporte adecuado.",
  },
];

const QUICK_QUERIES = [
  {
    id: "expediente",
    icon: ICONS.tramite,
    title: "Estado de expediente",
    text: "Consultá en qué oficina y etapa se encuentra tu expediente.",
    query: "¿Cuál es el estado de mi expediente?",
  },
  {
    id: "recibo",
    icon: ICONS.solicitud,
    title: "Recibo de sueldo",
    text: "Resolvé dudas sobre tus recibos de haberes y liquidaciones.",
    query: "¿Cómo veo mi recibo de sueldo?",
  },
  {
    id: "licencia",
    icon: ICONS.check,
    title: "Licencia médica",
    text: "Informate sobre requisitos y plazos para presentar licencias.",
    query: "¿Cómo solicito una licencia médica?",
  },
];

const TOPICS = [
  {
    id: "tramites-requisitos",
    index: "01",
    title: "Trámites y requisitos",
    text: "Qué documentación y pasos necesitás para cada gestión.",
  },
  {
    id: "documentacion",
    index: "02",
    title: "Documentación",
    text: "Formularios, descargas y documentación de respaldo solicitada.",
  },
  {
    id: "consultas-administrativas",
    index: "03",
    title: "Consultas administrativas",
    text: "Respuestas claras sobre procedimientos internos y gestiones.",
  },
  {
    id: "informacion-institucional",
    index: "04",
    title: "Información institucional",
    text: "Datos generales, horarios, sedes y canales de atención.",
  },
];

const FINAL_CTA = {
  kicker: "Probá el asistente",
  title: "¿Tenés una consulta? Hablá con ChatAP.",
  lead: "No hace falta esperar ni hacer fila. Escribí tu consulta y el asistente te orienta al momento.",
  primary: { label: "Comenzar una consulta", to: "/chat" },
};

const INSTITUTIONAL_LOGOS = [
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
  {
    id: "todos-unidos",
    title: "Todos Unidos",
    node: (
      <span className="institutional-mark institutional-mark--unidos" aria-hidden="true">
        <span className="institutional-mark__star">✦</span>
        <span>Todos Unidos</span>
      </span>
    ),
  },
  {
    id: "gobierno-formosa",
    title: "Gobierno de la Provincia de Formosa",
    node: (
      <span className="institutional-mark institutional-mark--gobierno" aria-hidden="true">
        <span className="institutional-mark__seal">F</span>
        <span>Gobierno de<br />Formosa</span>
      </span>
    ),
  },
];

function ActionMockup() {
  return (
    <div
      className="w-full rounded-3xl border border-line bg-mist/60 p-4 sm:p-6 shadow-sm"
      aria-label="Ejemplo de conversación con ChatAP"
      role="img"
    >
      <div className="mx-auto max-w-sm flex flex-col gap-3">
        <div className="chat-msg chat-msg--user">
          <div className="chat-msg__body">¿Cómo solicito una licencia médica?</div>
          <span className="chat-msg__meta">Vos</span>
        </div>

        <div className="chat-msg">
          <div className="chat-msg__body">
            Las licencias por enfermedad se gestionan con el formulario oficial y el certificado médico presentado dentro de las 48 hs hábiles.
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="bubble-chip">Descargar formulario de licencia</span>
            <span className="bubble-chip">Presentar en Mesa de Entradas</span>
          </div>
          <span className="chat-msg__meta mt-2">Asistente</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   Componentes de sección
   ------------------------------------------------------------------ */

function SectionHeader({ kicker, title, lead, center = false, float = false }) {
  return (
    <header className={`flex flex-col gap-4 ${center ? "items-center text-center" : "items-start"} max-w-3xl`}>
      <Kicker>{kicker}</Kicker>
      {float ? (
        <ScrollFloat
          as="h2"
          containerClassName="display-2 text-ink m-0 font-neue"
          animationDuration={0.9}
          ease="back.inOut(1.7)"
          scrollStart="center bottom+=30%"
          scrollEnd="bottom bottom-=25%"
          stagger={0.025}
        >
          {title}
        </ScrollFloat>
      ) : (
        <DisplayTitle as={2}>{title}</DisplayTitle>
      )}
      {lead ? <Lead className="mt-1">{lead}</Lead> : null}
    </header>
  );
}

export default function HomePage() {
  const heroRef = useRef(null);
  const theme = useTheme();

  const isLowEnd = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const cores = navigator.hardwareConcurrency ?? 4;
    const memory = navigator.deviceMemory ?? 4;
    const isMobile = navigator.maxTouchPoints > 0 && window.innerWidth < 768;
    return isMobile || cores < 4 || memory < 4;
  }, []);

  /* Precarga el chunk del chat cuando el usuario apunta a un enlace hacia /chat */
  const prefetchChat = () => {
    import("../pages/CiudadanoPage").catch(() => {});
  };

  useLayoutEffect(() => {
    const hero = heroRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!hero || reducedMotion) return undefined;

    const context = gsap.context(() => {
      /* Kicker entrance */
      gsap.fromTo(
        ".hero-cinematic__kicker",
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", delay: 0.45 },
      );

      /* Logo loop entrance */
      gsap.fromTo(
        ".hero-cinematic .hero-logo-loop",
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 1 },
      );
    }, hero);

    return () => {
      context.revert();
    };
  }, []);

  /* Ambientación general: los bloques de contenido reaccionan al scroll
     en AMBOS sentidos (scrub reversible: subís → vuelve a ocultarse). */
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;

    const blocks = gsap.utils.toArray("[data-reveal]");
    if (!blocks.length) return undefined;

    const context = gsap.context(() => {
      blocks.forEach((block) => {
        gsap.fromTo(
          block,
          { autoAlpha: 0, y: 34 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "none",
            scrollTrigger: {
              trigger: block,
              start: "top bottom+=18%",
              end: "top center",
              scrub: true,
            },
          },
        );
      });
    });

    return () => context.revert();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Navbar />

      <main id="contenido" className="flex-1 w-full">

        {/* 1 · Hero */}
        <section ref={heroRef} className="section-bleed hero-cinematic">
          {!isLowEnd && (
            <Suspense fallback={null}>
              <CRTWarp
                className="hero-cinematic__crtwarp"
                color={theme === "dark" ? "#f3f1e9" : "#ff9100"}
                backgroundColor={theme === "dark" ? "#171717" : "#f1eee7"}
                speed={0.10}
                curvature={0.16}
                scanlineStrength={0.035}
                scanlineFrequency={180}
                waveAmplitude={0.18}
                waveFrequency={2.0}
                bloom={0.35}
                bloomRadius={0.8}
                noise={0.012}
                vignette={0.35}
                brightness={theme === "dark" ? 0.38 : 0.55}
                pixelation={1}
                rgbShift={0.001}
                mouseReact
                mouseStrength={0.18}
                dpr={1}
                resolutionScale={0.55}
                fps={isLowEnd ? 18 : 24}
              />
            </Suspense>
          )}
          <div className="hero-cinematic__overlay" aria-hidden="true" />
          <div className="ed-max hero-cinematic__inner pt-16 pb-20 md:pt-24 md:pb-28">
            <div className="flex max-w-6xl flex-col items-start gap-6">
              <Kicker className="hero-cinematic__kicker">{HERO.kicker}</Kicker>
              <ScrollFloat
                as="h1"
                mode="once"
                delay={0.3}
                containerClassName="hero-cinematic__title"
                textClassName="hero-cinematic__text"
                animationDuration={1.05}
                ease="back.out(1.7)"
                stagger={0.012}
              >
                {HERO.title}
              </ScrollFloat>
            </div>

            <div className="hero-logo-loop hero-logo-loop--full">
              <p>Un proyecto hecho en Formosa</p>
              <LogoLoop
                logos={INSTITUTIONAL_LOGOS}
                speed={34}
                direction="left"
                logoHeight={40}
                gap={48}
                fadeOut
                fadeOutColor={theme === "dark" ? "#171717" : "#f1eee7"}
                pauseOnHover
                scaleOnHover
                ariaLabel="ChatAP, Todos Unidos y Gobierno de Formosa"
              />
            </div>
          </div>
        </section>


        {/* 2 · Qué es ChatAP */}
        <section id="que-es" className="section-bleed bg-mist/40">
          <div className="ed-max py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
            <div data-reveal className="flex flex-col gap-5 max-w-xl">
              <Kicker>{ABOUT.kicker}</Kicker>
              <ScrollFloat
                as="h2"
                containerClassName="display-2 text-ink m-0 font-neue"
                animationDuration={0.9}
                ease="back.inOut(1.7)"
                scrollStart="center bottom+=30%"
                scrollEnd="bottom bottom-=25%"
                stagger={0.025}
              >
                {ABOUT.title}
              </ScrollFloat>
              {ABOUT.paragraphs.map((p) => (
                <p key={p} className="text-base leading-relaxed text-muted m-0">
                  {p}
                </p>
              ))}
            </div>

            <div data-reveal className="flex flex-col gap-4">
              <MetricStrip items={ABOUT.numbers} cols="grid-cols-1 sm:grid-cols-3" />
              <p className="text-xs text-faint m-0 px-1">
                Conocimiento activo del asistente, según la base documental actual del sistema.
              </p>
            </div>
          </div>
        </section>

        {/* 3 · ChatAP en acción */}
        <section id="en-accion" className="section-bleed bg-paper">
          <div className="ed-max py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ActionMockup />

            <div data-reveal className="flex flex-col gap-10 lg:pl-6">
              <SectionHeader float kicker={ACTION.kicker} title={ACTION.title} lead={ACTION.lead} />
              <ol className="m-0 p-0 list-none flex flex-col gap-7">
                {ACTION.steps.map((s, i) => (
                  <li key={s.id} className="flex gap-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-sm font-bold text-brand-deep" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <p className="m-0 text-sm font-bold text-ink uppercase tracking-wider">{s.label}</p>
                      <p className="m-0 text-sm leading-relaxed text-muted">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 4 · Qué puede hacer */}
        <section id="capacidades" className="section-bleed bg-mist/40">
          <div className="ed-max py-20 md:py-28">
            <SectionHeader
              float
              kicker="Qué puede hacer"
              title="Te acompaña en cada consulta"
              lead="Estas son algunas de las cosas que ChatAP puede hacer por vos hoy."
            />

            <div data-reveal className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Capacidad destacada */}
              <article className="card p-7 md:col-span-2 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-4 max-w-xl">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-deep/10 text-brand-deep">
                    <Icon path={CHATAP_CAPABILITIES[0].icon} className="h-6 w-6" />
                  </span>
                  <h3 className="text-xl font-bold text-ink m-0">{CHATAP_CAPABILITIES[0].title}</h3>
                  <p className="text-base leading-relaxed text-muted m-0">{CHATAP_CAPABILITIES[0].text}</p>
                </div>
                <div className="self-center md:self-start shrink-0">
                  <ChatBotAvatar static size={120} reaction="idle" />
                </div>
              </article>

              {CHATAP_CAPABILITIES.slice(1).map((cap) => (
                <article key={cap.id} className="card p-6 flex flex-col gap-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-deep/10 text-brand-deep">
                    <Icon path={cap.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-bold text-ink m-0">{cap.title}</h3>
                  <p className="text-sm leading-relaxed text-muted m-0">{cap.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 5 · Consultas frecuentes */}
        <section id="consultas-frecuentes" className="section-bleed bg-paper">
          <div className="ed-max py-20 md:py-28">
            <SectionHeader
              float
              kicker="Consultas frecuentes"
              title="Entrá directo a lo que buscás"
              lead="Preguntas de ejemplo para que veas cómo responde el asistente. Elegí una y te lleva al chat preparada."
            />

            <div data-reveal className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {QUICK_QUERIES.map((q) => (
                <Link
                  key={q.id}
                  to="/chat"
                  state={{ initialQuery: q.query }}
                  onPointerEnter={prefetchChat}
                  className="quick-reply-card no-underline"
                >
                  <span className="quick-reply-icon" aria-hidden="true">
                    <Icon path={q.icon} />
                  </span>
                  <span className="quick-reply-copy">
                    <span className="quick-reply-label">{q.title}</span>
                    <span className="quick-reply-description">{q.text}</span>
                  </span>
                  <svg className="quick-reply-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 6 · Temas y trámites */}
        <section id="temas-tramites" className="section-bleed bg-mist/40">
          <div className="ed-max py-20 md:py-28">
            <SectionHeader
              float
              kicker="Temas y trámites"
              title="¿Sobre qué podés consultar?"
              lead="El contenido del asistente se organiza en áreas que cubren las gestiones más habituales."
            />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-px border border-line bg-line overflow-hidden rounded-3xl">
              {TOPICS.map((topic) => (
                <article key={topic.id} className="bg-paper p-7 md:p-9 flex flex-col gap-3">
                  <span className="font-mono text-xs font-bold tracking-widest text-brand-deep" aria-hidden="true">
                    {topic.index}
                  </span>
                  <h3 className="text-lg font-bold text-ink m-0">{topic.title}</h3>
                  <p className="text-sm leading-relaxed text-muted m-0 max-w-md">{topic.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 7 · CTA final */}
        <section id="cta" className="section-bleed bg-paper">
          <div className="ed-max py-20 md:py-28">
            <div className="cta-cinematic rounded-3xl text-paper p-8 md:p-16 flex flex-col items-start gap-5 md:items-center md:text-center">
              <p className="m-0 font-neue tracking-[0.22em] text-xs font-semibold uppercase text-paper/60">
                {FINAL_CTA.kicker}
              </p>
              <ScrollFloat
                as="h2"
                mode="once"
                containerClassName="m-0 text-3xl font-bold tracking-tight text-paper md:text-4xl font-neue"
                animationDuration={0.9}
                ease="back.inOut(1.7)"
                stagger={0.035}
                scrollStart="center bottom+=30%"
                scrollEnd="bottom bottom-=25%"
              >
                {FINAL_CTA.title}
              </ScrollFloat>
              <p className="m-0 max-w-2xl text-base leading-relaxed text-paper/70 md:text-lg">
                {FINAL_CTA.lead}
              </p>
              <Link to={FINAL_CTA.primary.to} onPointerEnter={prefetchChat} className="btn-primary no-underline mt-2">
                {FINAL_CTA.primary.label}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}