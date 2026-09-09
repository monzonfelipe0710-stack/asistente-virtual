import { Link } from "react-router-dom";
import { motion } from "motion/react";

const ACCESS_OPTIONS = [
  {
    id: "ciudadano",
    title: "Ciudadano",
    desc: "Realizá consultas, seguí expedientes y gestioná trámites administrativos. Sin registro para consultas generales.",
    cta: "Empezar como ciudadano",
    to: "/chat",
  },
  {
    id: "empleado",
    title: "Empleado",
    desc: "Si sos agente de la Administración Pública Provincial, registrate para acceder a las herramientas de gestión interna.",
    cta: "Registrarme",
    to: "/login",
  },
];

const WHY = [
  {
    title: "Información que es tuya",
    desc: "Todo lo que consultás queda en tus manos. Sin intermediarios, sin intérpretes, sin papeles perdidos.",
  },
  {
    title: "Atención sin horario",
    desc: "Las 24 horas, los 7 días. Sin turno, sin fila, sin depender del horario de ningún organismo.",
  },
  {
    title: "El organismo correcto",
    desc: "Más de 16 áreas de gobierno accesibles desde un mismo lugar, sin navegar portales desconectados.",
  },
  {
    title: "Constancia de cada gestión",
    desc: "Registros, estados de expediente y documentos. Todo guardado y verificado en SIGED.",
  },
];

export default function TrustSection() {
  return (
    <>
      {/* ── Cómo acceder ─────────────────────────────────────── */}
      <motion.section
        id="confianza"
        className="chatap-access"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ed-max section-bleed">
          <div className="chatap-section-heading">
            <p className="chatap-label">05 · ACCESO</p>
            <h2>Una puerta para cada necesidad.</h2>
            <p>El mismo lenguaje claro para ciudadanos y equipos de la Administración Pública Provincial.</p>
          </div>

          <div className="chatap-access__grid">
            {ACCESS_OPTIONS.map((opt) => (
              <div key={opt.id} className="chatap-access__card">
                <span className="chatap-access__index">{opt.id === "ciudadano" ? "A" : "B"}</span>
                <h3>{opt.title}</h3>
                <p>{opt.desc}</p>
                <Link to={opt.to} className="chatap-link">{opt.cta} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Por qué usarlo ───────────────────────────────────── */}
      <motion.section
        className="chatap-proof"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="ed-max section-bleed">
          <div className="chatap-section-heading">
            <p className="chatap-label">06 · PRINCIPIOS</p>
            <h2>La atención pública, hecha para las personas.</h2>
          </div>

          <div className="chatap-proof__grid">
            {WHY.map((w, i) => (
              <div key={w.title} className="chatap-proof__item">
                <span>0{i + 1}</span>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </>
  );
}