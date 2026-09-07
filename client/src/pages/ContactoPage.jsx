import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useToast } from "../components/common/Toast";
import { useAuth } from "../context/AuthContext";

const FAQS_RAPIDAS = [
  {
    q: "¿Dónde consulto mis recibos de haberes?",
    a: "Podés ver y descargar tus recibos ingresando al portal SUAF con tu CUIL y contraseña. Si no podés ingresar, escribinos por el formulario o por WhatsApp para blanquear tu acceso.",
  },
  {
    q: "¿Cómo solicito una licencia médica o anual?",
    a: "Las licencias se solicitan mediante el formulario oficial con firma de tu superior y deben presentarse en Mesa de Entradas. En caso de enfermedad, contás con 48 hs hábiles para presentar el certificado médico.",
  },
  {
    q: "¿Cómo hago el seguimiento de un expediente en SIGED?",
    a: "Ingresá con tu número de expediente (ej. EXP-0028/2026) en la sección SIGED o consultanos con tu DNI para que verifiquemos en qué oficina se encuentra.",
  },
  {
    q: "¿Qué hago si olvidé mi contraseña o no puedo ingresar?",
    a: "Podés restablecer tu clave desde la pantalla de inicio de sesión haciendo clic en '¿Olvidaste tu contraseña?'. Si persistís con inconvenientes, envianos tu DNI por WhatsApp para una solución inmediata.",
  },
];

const MOTIVOS = [
  { id: "acceso", label: "Problemas para ingresar o contraseña" },
  { id: "haberes", label: "Recibos de sueldo / Liquidaciones" },
  { id: "licencias", label: "Licencias e inasistencias" },
  { id: "siged", label: "Seguimiento de expediente / Trámites" },
  { id: "otro", label: "Otra consulta o gestión" },
];

export default function ContactoPage() {
  const [searchParams] = useSearchParams();
  const addToast = useToast();
  const { user } = useAuth();

  const initialMotivo = searchParams.get("motivo") || "acceso";

  const [form, setForm] = useState({
    name: user?.name || "",
    contact: user?.email || "",
    motivo: initialMotivo,
    message: "",
  });

  const [openFaq, setOpenFaq] = useState(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !form.name) {
      setForm((prev) => ({
        ...prev,
        name: user.name || prev.name,
        contact: user.email || prev.contact,
      }));
    }
  }, [user, form.name]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) {
      addToast("Por favor completá tu nombre, contacto y mensaje", "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSent(true);
      addToast("¡Consulta enviada! Te responderemos a la brevedad.", "success");
    }, 500);
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-brand-deep/10 selection:text-brand-deep">
      <Navbar />

      <main className="flex-1 w-full animate-page-enter">
        {/* Encabezado simple y claro */}
        <section className="border-b border-line/70 bg-gradient-to-b from-mist/80 via-mist/30 to-paper py-10 sm:py-14">
          <div className="ed-max section-bleed">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-widest mb-3">
                <Link to="/" className="text-muted hover:text-ink transition-colors no-underline">
                  Inicio
                </Link>
                <span>/</span>
                <span className="text-brand-deep font-bold">Soporte</span>
              </div>

              <p className="kicker mb-2">SUBSECRETARÍA DE RECURSOS HUMANOS</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink m-0">
                ¿En qué te podemos ayudar?
              </h1>
              <p className="text-base sm:text-lg text-muted mt-3 m-0 leading-relaxed max-w-2xl">
                Elegí un canal de atención directa o dejanos tu consulta y te responderemos a la brevedad.
              </p>

              {/* Estado de atención */}
              <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-line bg-paper text-xs shadow-soft">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-semibold text-ink">Mesa de ayuda activa</span>
                <span className="text-muted">· Lun a Vie 07:00 a 19:00 hs</span>
              </div>
            </div>

            {/* 3 Canales de Respuesta Rápida */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* WhatsApp */}
              <a
                href="https://wa.me/5493704000000?text=Hola,%20necesito%20ayuda%20con%20un%20tr%C3%A1mite%20en%20el%20portal%20de%20Recursos%20Humanos"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover no-underline"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-11 h-11 rounded-xl bg-emerald-500 text-paper flex items-center justify-center shadow-xs">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full">
                    Respuesta rápida
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink m-0">WhatsApp Oficial</h3>
                <p className="text-xs text-muted mt-1 m-0">Atención personalizada por chat.</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                  Abrir WhatsApp (+54 9 3704-000000) →
                </span>
              </a>

              {/* Teléfono 0800 */}
              <a
                href="tel:08005551234"
                className="group p-6 rounded-2xl border border-line bg-paper hover:border-brand/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover no-underline"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-11 h-11 rounded-xl bg-brand-deep/10 text-brand-deep flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted bg-mist px-2.5 py-1 rounded-full border border-line">
                    Sin costo
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink m-0">0800-555-1234</h3>
                <p className="text-xs text-muted mt-1 m-0">Línea gratuita de atención telefónica.</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-deep group-hover:underline">
                  Llamar ahora por teléfono →
                </span>
              </a>

              {/* ChatAP 24/7 */}
              <Link
                to="/chat"
                className="group p-6 rounded-2xl border border-line bg-paper hover:border-brand/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hover no-underline"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-11 h-11 rounded-xl bg-primary-light text-brand-deep flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-deep bg-primary-lighter px-2.5 py-1 rounded-full border border-brand/20">
                    24 horas
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink m-0">Asistente Virtual ChatAP</h3>
                <p className="text-xs text-muted mt-1 m-0">Respuestas automáticas al instante.</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-deep group-hover:underline">
                  Hacer una consulta en el chat →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Sección de 2 columnas: Formulario rápido + Preguntas frecuentes */}
        <section className="py-12 sm:py-16">
          <div className="ed-max section-bleed">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Formulario Rápido */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-line bg-paper p-6 sm:p-9 shadow-soft">
                  <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight m-0">
                    Dejanos tu mensaje
                  </h2>
                  <p className="text-sm text-muted mt-1.5 mb-6 m-0">
                    Completá tus datos y te responderemos por correo o teléfono en el transcurso del día.
                  </p>

                  {sent ? (
                    <div className="py-8 text-center animate-scale-in">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-ink m-0">¡Consulta enviada con éxito!</h3>
                      <p className="text-sm text-muted mt-2 max-w-md mx-auto">
                        Recibimos tu mensaje. Un agente de la Subsecretaría de Recursos Humanos se pondrá en contacto a la brevedad.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSent(false);
                          setForm((prev) => ({ ...prev, message: "" }));
                        }}
                        className="mt-6 px-5 py-2.5 rounded-xl border border-line bg-mist/60 text-xs font-bold uppercase tracking-wider text-ink hover:bg-paper cursor-pointer transition-colors"
                      >
                        Enviar otra consulta
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Nombre */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                          Nombre y Apellido *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Tu nombre completo"
                          className="w-full px-4 py-3 rounded-xl border border-line bg-mist/30 text-ink text-sm focus:outline-none focus:border-brand-deep focus:bg-paper transition-all"
                        />
                      </div>

                      {/* Contacto (Email o Teléfono) */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                          Email o Teléfono de contacto *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.contact}
                          onChange={(e) => setForm({ ...form, contact: e.target.value })}
                          placeholder="ejemplo@correo.com o 3704-123456"
                          className="w-full px-4 py-3 rounded-xl border border-line bg-mist/30 text-ink text-sm focus:outline-none focus:border-brand-deep focus:bg-paper transition-all"
                        />
                      </div>

                      {/* Motivo */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                          ¿Sobre qué es tu consulta? *
                        </label>
                        <select
                          value={form.motivo}
                          onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-line bg-mist/30 text-ink text-sm font-medium focus:outline-none focus:border-brand-deep focus:bg-paper transition-all cursor-pointer"
                        >
                          {MOTIVOS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mensaje */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                          Mensaje o detalle *
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="Escribí brevemente en qué podemos ayudarte..."
                          className="w-full px-4 py-3 rounded-xl border border-line bg-mist/30 text-ink text-sm focus:outline-none focus:border-brand-deep focus:bg-paper transition-all resize-none leading-relaxed"
                        />
                      </div>

                      {/* Botón enviar */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-brand-deep text-paper text-sm font-bold uppercase tracking-wider hover:bg-brand transition-all duration-200 cursor-pointer shadow-soft hover:shadow-hover flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <span className="w-4 h-4 rounded-full border-2 border-paper border-t-transparent animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>Enviar Consulta</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Columna derecha: Preguntas rápidas y Atención presencial */}
              <div className="lg:col-span-5 space-y-6" id="faq">
                <div className="rounded-3xl border border-line bg-paper p-6 sm:p-8 shadow-soft">
                  <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight m-0 mb-1">
                    Preguntas frecuentes
                  </h2>
                  <p className="text-xs text-muted mb-5 m-0">
                    Respuestas inmediatas a las dudas más comunes.
                  </p>

                  <div className="space-y-2.5">
                    {FAQS_RAPIDAS.map((item, idx) => {
                      const isOpen = openFaq === idx;
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-line/80 bg-mist/20 overflow-hidden transition-all duration-200"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                            className="w-full p-3.5 text-left flex items-start justify-between gap-3 cursor-pointer bg-transparent border-0"
                          >
                            <span className="text-xs sm:text-[13px] font-bold text-ink leading-snug">
                              {item.q}
                            </span>
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 text-muted ${
                                isOpen ? "rotate-180 text-brand-deep" : ""
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                          </button>

                          {isOpen && (
                            <div className="px-3.5 pb-3.5 pt-1 text-xs text-muted leading-relaxed border-t border-line/50 animate-fade-in">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ubicación y Atención Presencial */}
                <div className="rounded-3xl border border-line bg-mist/40 p-6">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-xl bg-paper border border-line text-brand-deep flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-ink m-0">Atención Presencial</h3>
                      <p className="text-xs text-muted mt-1 m-0">
                        <strong className="text-ink">Mesa de Entrada Central:</strong> Belgrano 836, Formosa Capital.
                      </p>
                      <p className="text-xs text-muted mt-0.5 m-0">
                        Lunes a Viernes de 07:00 a 13:00 y 14:00 a 19:00 hs.
                      </p>
                      <p className="text-xs text-muted mt-1.5 m-0">
                        Correo oficial: <span className="font-semibold text-ink">mesadeayuda@subsechh.formosa.gob.ar</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
