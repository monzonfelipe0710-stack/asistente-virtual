import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import ChatBotAvatar from "../ChatBotAvatar";

export default function Hero() {
  const heroRef = useRef(null);
  const [ready, setReady] = useState(false);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const avatarY = useTransform(scrollYProgress, [0, 1], [0, 34]);
  const avatarOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section ref={heroRef} id="inicio" aria-label="Presentación de ChatAP" className="chatap-hero">
      <div className="chatap-hero__inner">
        <div className={`chatap-hero__title ${ready ? "animate-fade-up" : "opacity-0"}`}>
          <p className="chatap-label">ASISTENTE VIRTUAL · FORMOSA</p>
          <h1>CHAT<span>AP</span></h1>
        </div>

        <motion.div
          className={`chatap-hero__avatar ${ready ? "animate-scale-in" : "opacity-0"}`}
          style={{ y: avatarY, opacity: avatarOpacity }}
          aria-label="Avatar de ChatAP"
          role="img"
        >
          <span className="chatap-hero__avatar-ring" aria-hidden="true" />
          <ChatBotAvatar size={178} reaction="idle" />
          <span className="chatap-hero__avatar-index">01 / 06</span>
        </motion.div>

        <div className={`chatap-hero__intro ${ready ? "animate-fade-up" : "opacity-0"}`}>
          <p className="chatap-label">ASISTENTE INTELIGENTE</p>
          <p>La Administración Pública de Formosa, en lenguaje claro, disponible cuando la necesitás.</p>
          <div className="chatap-hero__actions">
            <Link to="/chat" className="chatap-link chatap-link--solid">Iniciar consulta <span aria-hidden="true">↗</span></Link>
            <Link to="/login" className="chatap-link">Acceso interno <span aria-hidden="true">↗</span></Link>
          </div>
        </div>

        <div className="chatap-hero__footer">
          <span>SUBSECRETARÍA DE RECURSOS HUMANOS</span>
          <span>24 HORAS / 7 DÍAS</span>
          <span>SCROLL PARA EXPLORAR ↓</span>
        </div>
      </div>
    </section>
  );
}