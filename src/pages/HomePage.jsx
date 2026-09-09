import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { MotionConfig } from "motion/react";
import Hero from "../components/landing/Hero";
import IntroSection from "../components/landing/IntroSection";
import ServicesSection from "../components/landing/ServicesSection";
import ChatSection from "../components/landing/ChatSection";
import TrustSection from "../components/landing/TrustSection";
import FinalCta from "../components/landing/FinalCta";
import ScrollProgress from "../components/common/ScrollProgress";

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <>
        <ScrollProgress />
        <Navbar />
        <main className="chatap-landing">
          <Hero />
          <IntroSection />
          <ServicesSection />
          <ChatSection />
          <TrustSection />
          <FinalCta />
        </main>
        <Footer />
      </>
    </MotionConfig>
  );
}
