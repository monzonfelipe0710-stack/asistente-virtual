import { Link } from "react-router-dom";
import { motion } from "motion/react";

const SERVICES = [
  {
    title: "Trámites",
    desc: "Iniciá trámites con los requisitos paso a paso, sin formularios previos.",
    tag: "Iniciar",
    to: "/chat",
  },
  {
    title: "Información",
    desc: "Consultá requisitos, plazos y normativa oficial en lenguaje claro.",
    tag: "Consultar",
    to: "/chat",
  },
  {
    title: "Expedientes",
    desc: "Seguí el estado de tus expedientes desde cualquier dispositivo.",
    tag: "Seguir",
    to: "/chat",
  },
  {
    title: "Organismos",
    desc: "Encontrá el organismo y el área correcta para cada consulta.",
    tag: "Directorio",
    to: "/contacto",
  },
  {
    title: "Formularios",
    desc: "Descargá los formularios que necesitás, siempre la versión vigente.",
    tag: "Descargar",
    to: "/chat",
  },
  {
    title: "Derivaciones",
    desc: "Te conectamos con la persona y el área correcta, sin vueltas.",
    tag: "Canales",
    to: "/contacto",
  },
];

export default function ServicesSection() {
  return (
    <motion.section
      id="servicios"
      className="chatap-services"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ed-max section-bleed">
        <div className="chatap-section-heading chatap-section-heading--dark">
          <p className="chatap-label">03 · CAPACIDADES</p>
          <h2>Todo lo que necesitás. Un solo canal.</h2>
          <p>Orientación, documentación y seguimiento para que cada gestión encuentre su camino.</p>
        </div>

        <div className="chatap-services__grid">
          {SERVICES.map((s, i) => (
            <Link
              key={s.title}
              to={s.to}
              className={`chatap-service chatap-service--${i + 1}`}
            >
              <span className="chatap-service__number">0{i + 1}</span>
              <span className="chatap-service__title">{s.title}</span>
              <span className="chatap-service__desc">{s.desc}</span>
              <span className="chatap-service__tag">{s.tag} ↗</span>
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
}