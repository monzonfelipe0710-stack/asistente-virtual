import { Link } from "react-router-dom";
import { motion } from "motion/react";

export default function FinalCta() {
  return (
    <motion.section
      id="charla"
      className="chatap-contact"
      aria-label="Acceso al asistente"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ed-max section-bleed">
        <div className="chatap-contact__grid">
          <h2>HABLAMOS<br />CUANDO<br /><span>LO NECESITÁS.</span></h2>
          <div className="chatap-contact__details">
            <p className="chatap-label">¿TENÉS UNA CONSULTA?</p>
            <p>Encontrá una respuesta ahora o contactá al equipo de atención de la Subsecretaría de Recursos Humanos.</p>
            <div className="chatap-hero__actions">
              <Link to="/chat" className="chatap-link chatap-link--solid">Abrir ChatAP <span aria-hidden="true">↗</span></Link>
              <Link to="/contacto" className="chatap-link">Contactar soporte <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}