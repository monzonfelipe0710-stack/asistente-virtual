import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

const FAQS = [
  {
    id: "f1",
    q: "¿Qué es ChatAP?",
    a: "El asistente virtual oficial de la Subsecretaría de Recursos Humanos de Formosa. Unifica información de trámites, expedientes y organismos en un único canal conversacional, disponible las 24 horas.",
  },
  {
    id: "f2",
    q: "¿Cuándo está disponible?",
    a: "Las 24 horas, los 7 días de la semana. No hay horario de atención ni necesidad de turno previo.",
  },
  {
    id: "f3",
    q: "¿Quién puede usarlo?",
    a: "Cualquier ciudadano de la Provincia de Formosa. Para consultas generales no se requiere registro.",
  },
  {
    id: "f4",
    q: "¿Los datos son seguros?",
    a: "Sí. ChatAP opera bajo los protocolos de seguridad de la Administración Pública Provincial. Los datos personales nunca se comparten con terceros.",
  },
  {
    id: "f5",
    q: "¿Puedo seguir un expediente?",
    a: "Sí. ChatAP se conecta con SIGED para que puedas consultar el estado de tu expediente en tiempo real, sin ir a Mesa de Entradas.",
  },
  {
    id: "f6",
    q: "¿Necesito instalar algo?",
    a: "No. ChatAP funciona directamente desde el navegador, en cualquier dispositivo, sin descarga ni instalación.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-line last:border-b-0">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-4 bg-transparent px-6 py-5 text-left text-base font-medium text-ink transition-colors hover:bg-mist"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-lighter text-brand-deep"
          aria-hidden="true"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p className="px-6 pb-6 text-sm leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatSection() {
  return (
    <motion.section
      id="faq"
      className="chatap-faq"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ed-max section-bleed">
        <div className="chatap-faq__heading">
          <p className="chatap-label">04 · CHATAP RESPONDE</p>
          <h2>Preguntas frecuentes, respuestas directas.</h2>
          <p>Una base de conocimiento institucional para orientar cada consulta con precisión.</p>
        </div>

        <div className="chatap-faq__list">
          {FAQS.map((f) => (
            <FaqItem key={f.id} q={f.q} a={f.a} />
          ))}
        </div>

        <Link to="/chat" className="chatap-link chatap-link--solid chatap-faq__cta">Hacé tu consulta <span aria-hidden="true">↗</span></Link>
      </div>
    </motion.section>
  );
}