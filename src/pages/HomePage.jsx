import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Reveal from "../components/common/Reveal";
import ImageStage from "../components/common/ImageStage";
import ChatBotAvatar from "../components/ChatBotAvatar";
import {
  Kicker,
  Lead,
  SectionHeading,
  ArrowLink,
  Wordmark,
} from "../components/common/editorial";

const SOPORTE = [
  { label: "Mesa de ayuda", note: "Atención técnica y acceso", to: "/contacto?motivo=acceso" },
  { label: "WhatsApp oficial", note: "Respuesta rápida por chat", to: "/contacto" },
  { label: "Recibos y haberes", note: "Consultas de liquidación", to: "/contacto?motivo=haberes" },
  { label: "Preguntas frecuentes", note: "Respuestas inmediatas", to: "/contacto#faq" },
  { label: "Licencias y trámites", note: "Régimen y justificaciones", to: "/contacto?motivo=licencias" },
  { label: "Seguimiento SIGED", note: "Estado de expedientes", to: "/contacto?motivo=siged" },
];

const SOLICITUDES = [
  { label: "Constancia de servicios", ref: "EXP-0028/2026", status: "Pendiente", tone: "warn" },
  { label: "Certificado laboral", ref: "EXP-0133/2026", status: "Aprobada", tone: "ok" },
  { label: "Reincorporación y traslado", ref: "EXP-0071/2026", status: "Rechazada", tone: "bad" },
  { label: "Liquidación de haberes", ref: "EXP-0090/2026", status: "En proceso", tone: "info" },
];

const METRICS = [
  { label: "Usuarios activos", value: 1248 },
  { label: "Trámites disponibles", value: 84 },
  { label: "Respuestas brindadas", value: 3900, hint: "en los últimos 30 días" },
  { label: "Conversaciones", value: 297 },
];

const TICKER_ITEMS = [
  "Información oficial",
  "Seguimiento de expedientes",
  "Turnos y trámites",
  "Mesa de ayuda",
  "24 horas",
  "Certificados y constancias",
  "Documentación",
  "Sin filas",
];

const ACCENTS = {
  ok: { text: "text-ok", dot: "bg-ok" },
  warn: { text: "text-warn", dot: "bg-warn" },
  bad: { text: "text-bad", dot: "bg-bad" },
  info: { text: "text-brand", dot: "bg-brand" },
};

function CountUp({ value, className = "" }) {
  const ref = useRef(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [started, setStarted] = useState(prefersReduced);
  const [display, setDisplay] = useState(() => (prefersReduced ? value : 0));

  useEffect(() => {
    if (prefersReduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReduced]);

  useEffect(() => {
    if (!started) return;
    const dur = 1500;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value]);

  return <span ref={ref} className={className}>{display.toLocaleString("es-AR")}</span>;
}

function Tick() {
  return (
    <span className="mx-6 inline-block text-brand-deep" aria-hidden="true">✦</span>
  );
}

function Shield() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.6-3.06l-7.36-3.24a2 2 0 00-1.48 0L2.4 8.94a1 1 0 00-.5.9v5.32a1 1 0 00.49.86l7.36 3.24a2 2 0 001.48 0l7.36-3.24a1 1 0 00.49-.86V9.02a1 1 0 00-.51-.99z" />
    </svg>
  );
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);

  const navText = isAuthenticated ? "Continuá tu conversación" : "Preguntar a ChatAP";

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative border-b border-line/70 overflow-hidden">
        <div className="ed-max grid grid-cols-1 lg:grid-cols-12 min-h-[92vh]">
          <div className="lg:col-span-7 section-bleed flex flex-col justify-center py-24 lg:py-28 relative z-10">
            <Reveal variant="blur">
              <Kicker>[ Formosa · Subsecretaría de Recursos Humanos ]</Kicker>
            </Reveal>
            <Reveal variant="blur" delay={80}>
              <h1 className="display-1 text-ink mt-8 mb-0">
                CHATAP<span className="text-brand-deep">.</span>
              </h1>
            </Reveal>
            <Reveal variant="up" delay={160}>
              <p className="display-3 text-ink m-0 mt-6 max-w-xl">
                El asistente virtual de la administración pública provincial.
              </p>
            </Reveal>
            <Reveal variant="up" delay={260}>
              <Lead className="mt-8 max-w-xl">
                Respondemos tus preguntas sobre trámites, documentos y servicios, con
                información oficial, las 24 horas. Sin filas. Sin tiempos de espera.
              </Lead>
            </Reveal>
            <Reveal variant="up" delay={360}>
              <div className="mt-12 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/chat")}
                  className="btn-primary px-8! py-4! text-base"
                >
                  {navText}
                  <svg className="h-5 w-5 animate-arrow-slide" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <a
                  href="#que-es"
                  className="btn-ghost px-8! py-4! text-base no-underline"
                >
                  Conocé más
                </a>
              </div>
            </Reveal>
            <Reveal variant="up" delay={460}>
              <p className="mt-12 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-faint">
                <Shield />
                <span className="inline-block h-2 w-2 rounded-full bg-ok animate-pulse-dot" aria-hidden="true" />
                Información oficial · Gobierno de la Provincia de Formosa
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-5 hidden md:block relative overflow-hidden border-l border-line/70">
            <ImageStage
              kind="portico"
              accent
              aspect="h-full min-h-[60vh]"
              tint="text-ink/70"
              className="h-full"
            >
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-ink/10 text-[16vh] font-black tracking-tighter select-none animate-float">AP</span>
              </div>
            </ImageStage>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-brand-deep via-brand to-transparent animate-grow-line" aria-hidden="true" />
      </section>

      {/* CINTA / MARQUEE */}
      <div className="marquee bg-ink text-paper py-4 border-b border-line overflow-hidden select-none" aria-hidden="true">
        <div className="animate-ticker flex items-center whitespace-nowrap w-max">
          {[0, 1].map((half) => (
            <span key={half} className="flex items-center text-[11px] font-bold uppercase tracking-[0.24em]">
              {TICKER_ITEMS.map((item) => (
                <span key={item} className="flex items-center">
                  <span>{item}</span>
                  <Tick />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* QUÉ ES */}
      <section id="que-es" className="relative py-28 lg:py-40 border-b border-line/70 overflow-hidden">
        <div className="absolute -top-2 left-0 z-0" aria-hidden="true">
          <Wordmark className="text-[16vw]">CHATAP</Wordmark>
        </div>
        <div className="ed-max section-bleed relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6">
              <Reveal>
                <SectionHeading
                  kicker="Qué es ChatAP"
                  title={
                    <>
                      UNA NUEVA FORMA DE
                      <span className="display-break" />
                      INTERACTUAR CON EL ESTADO.
                    </>
                  }
                />
              </Reveal>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <Reveal delay={120}>
                <p className="editorial-text text-[1.05rem] m-0">
                  ChatAP es un punto único de contacto entre las personas y el Estado.
                  Una interfaz cuidada, un lenguaje claro y una base de conocimiento
                  oficial para que cada gestión sea más simple y transparente.
                </p>
              </Reveal>
              <Reveal delay={220}>
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    ["Respuesta inmediata", "Sin horarios ni filas. Disponible siempre."],
                    ["Fuentes oficiales", "Solo información verificada por el Estado."],
                    ["Acompañamiento", "Cuando hace falta, hay una persona al lado."],
                  ].map(([t, d]) => (
                    <div key={t} className="border-t-2 border-ink pt-5">
                      <h3 className="text-base font-bold text-ink m-0 tracking-tight">{t}</h3>
                      <p className="text-sm text-muted leading-relaxed m-0 mt-2">{d}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* CHAT PROTAGONISTA */}
      <section className="border-b border-line/70">
        <div className="ed-max section-bleed grid grid-cols-1 lg:grid-cols-2 min-h-[70vh] lg:items-stretch">
          <div className="flex flex-col justify-center py-24 lg:py-28 lg:pr-12">
            <Reveal>
              <SectionHeading
                kicker="Chat IA"
                title={
                  <>
                    PREGUNTÁ.
                    <span className="display-break" />
                    CHATAP RESPONDE.
                  </>
                }
                lead="Escribí como hablarías con una persona. ChatAP te orienta y, si hace falta, te conecta con un agente real."
              />
            </Reveal>

            <Reveal delay={160}>
              <div
                tabIndex={0}
                onFocus={() => setListening(true)}
                onBlur={() => setListening(false)}
                className="ask-bar mt-12 rounded-full pl-6 pr-2 py-2 flex items-center gap-2 max-w-2xl cursor-text outline-none transition-shadow focus-within:ring-2 focus-within:ring-brand/50"
              >
                <svg className="h-5 w-5 text-faint shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="flex-1 text-sm text-muted truncate">¿Necesitás el certificado laboral?</span>
                <span className="btn-primary shrink-0 px-6! cursor-default" aria-hidden="true">
                  Enviar
                </span>
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex items-center gap-3">
                <span className="flex items-end gap-[3px] h-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="wave-bar w-[3px] h-4 rounded-full bg-brand-deep/70" />
                  ))}
                </span>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-faint m-0">
                  ChatAP responde en segundos
                </p>
              </div>
            </Reveal>
          </div>

          <div className="hidden lg:flex items-center justify-center min-h-[70vh] bg-paper">
            <ChatBotAvatar size={240} reaction={listening ? "attention" : "idle"} />
          </div>
        </div>
      </section>

      {/* SOPORTE */}
      <section className="py-28 lg:py-40 border-b border-line/70 bg-mist/40">
        <div className="ed-max section-bleed">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <Reveal>
              <SectionHeading
                kicker="Soporte"
                title={
                  <>
                    UN EQUIPO REAL.
                    <span className="display-break" />
                    CUANDO LO NECESITÁS.
                  </>
                }
                lead="Cuando el bot no alcanza, hay personas formadas y disponibles para acompañarte en cada gestión."
              />
            </Reveal>
            <Reveal delay={150}>
              <ArrowLink className="mb-2" to="/contacto">
                Ir a soporte
              </ArrowLink>
            </Reveal>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SOPORTE.map((t, i) => (
              <Reveal key={t.label} delay={i * 60}>
                <Link
                  to={t.to || "/contacto"}
                  className="group flex flex-col justify-between aspect-[4/5] rounded-2xl border border-line/70 bg-paper p-6 hover:border-brand/40 hover:bg-primary-lighter transition-all duration-300 hover:-translate-y-1.5 hover:shadow-hover no-underline"
                >
                  <span className="text-3xl font-light text-muted opacity-40 transition-colors group-hover:opacity-80 group-hover:text-brand-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-base font-bold text-ink tracking-tight">{t.label}</span>
                    <span className="block text-[13px] text-faint mt-2 leading-snug">{t.note}</span>
                    <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-deep opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                      Ver soporte
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SOLICITUDES */}
      <section className="py-28 lg:py-40 border-b border-line/70">
        <div className="ed-max section-bleed grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <Reveal>
              <SectionHeading
                kicker="Solicitudes"
                title={
                  <>
                    ESTADO DE TU
                    <span className="display-break" />
                    GESTIÓN. EN CLARO.
                  </>
                }
                lead="Cada solicitud con un número de expediente y un estado inequívoco. Sin llamadas, sin dudas."
              />
            </Reveal>
            <Reveal delay={200}>
              <ArrowLink className="mt-10" to="/perfil">
                Entrar a mi perfil
              </ArrowLink>
            </Reveal>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="border-t border-line/70">
              {SOLICITUDES.map((s, i) => {
                const tone = ACCENTS[s.tone] || ACCENTS.info;
                return (
                  <Reveal key={s.ref} delay={i * 80}>
                    <div className="grid grid-cols-12 items-center gap-4 border-b border-line/70 py-6">
                      <span className="col-span-7 sm:col-span-6">
                        <span className="block text-base font-bold text-ink tracking-tight">{s.label}</span>
                        <span className="block text-xs text-faint mt-1 font-medium uppercase tracking-wider">{s.ref}</span>
                      </span>
                      <span className="col-span-3 text-left">
                        <span className="hidden sm:block text-xs text-muted opacity-70">Estado</span>
                      </span>
                      <span className="col-span-2 sm:col-span-3 text-right sm:text-left">
                        <span className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${tone.text}`}>
                          <span className={`h-2 w-2 rounded-full ${tone.dot} animate-pulse-dot`} />
                          {s.status}
                        </span>
                      </span>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <Reveal delay={120}>
              <p className="mt-6 text-xs text-faint m-0">
                Listado ilustrativo. Estado real de cada solicitud en &ldquo;Mi perfil&rdquo;.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* DOCUMENTOS */}
      <section className="py-28 lg:py-40 border-b border-line/70 bg-mist/40">
        <div className="ed-max section-bleed grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <Reveal variant="img">
              <ImageStage kind="docs" accent aspect="aspect-[4/3]" tint="text-ink/75" label="Documentación oficial" />
            </Reveal>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal>
              <SectionHeading
                kicker="Documentos"
                title="TODO LO QUE NECESITÁS, EN UN SOLO LUGAR."
              />
            </Reveal>
            <Reveal delay={120}>
              <ul className="mt-10 m-0 p-0 list-none">
                {["Constancia laboral", "Recibos y liquidaciones", "Certificados de servicios", "Formularios descargables"].map((d) => (
                  <li key={d} className="flex items-center justify-between border-b border-line/70 py-4 transition-colors hover:bg-mist/60 hover:px-2 rounded-lg group">
                    <span className="text-[15px] font-medium text-ink">{d}</span>
                    <span className="flex items-center gap-3 text-xs text-faint font-bold uppercase tracking-wider transition-all group-hover:text-brand-deep">
                      PDF
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={200}>
              <ArrowLink className="mt-10" to="/contacto">
                Ver documentación
              </ArrowLink>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className="py-28 lg:py-40 bg-ink text-paper relative overflow-hidden">
        <div className="ed-max section-bleed">
          <Reveal>
            <div className="max-w-3xl">
              <Kicker className="text-paper/60!">Estadísticas</Kicker>
              <h2 className="display-3 text-paper m-0 mt-5">
                UNA PLATAFORMA EN NÚMEROS.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-16 grid gap-px bg-paper/15 border border-paper/15 overflow-hidden rounded-2xl grid-cols-2 md:grid-cols-4">
              {METRICS.map((m) => (
                <div key={m.label} className="bg-ink p-6 md:p-8">
                  <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-paper/50">{m.label}</p>
                  <p className="mt-4 m-0 text-4xl md:text-6xl font-extrabold tracking-tighter text-paper">
                    <CountUp value={m.value} />
                  </p>
                  {m.hint ? <p className="mt-2 m-0 text-sm text-paper/50">{m.hint}</p> : null}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        <div className="absolute -right-10 -top-6 opacity-[0.06]" aria-hidden="true">
          <span className="block text-paper text-[22vw] font-black tracking-tighter select-none animate-float">AP</span>
        </div>
      </section>

      {/* IMAGEN FINAL */}
      <section className="relative overflow-hidden">
        <ImageStage
          kind="portico"
          accent
          aspect="aspect-[16/9] md:aspect-[21/9]"
          tint="text-paper/90"
          className="w-full"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink/90" />
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <Reveal>
              <div className="flex flex-col items-center gap-6 max-w-3xl">
                <p className="display-3 text-paper m-0">
                  FORMOSA. AL LADO
                  <span className="display-break" />
                  DE SU GENTE.
                </p>
                <Lead className="text-paper/70 m-0">
                  Un Estado que escucha, responde y acompaña. Empezá ya tu próxima gestión.
                </Lead>
                <button
                  type="button"
                  onClick={() => navigate("/chat")}
                  className="btn-primary px-8! py-4! text-base"
                >
                  {navText === "Preguntar a ChatAP" ? "Consultar ahora" : "Ir al chat"}
                  <svg className="h-5 w-5 animate-arrow-slide" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </Reveal>
          </div>
        </ImageStage>
      </section>

      <Footer />
    </>
  );
}