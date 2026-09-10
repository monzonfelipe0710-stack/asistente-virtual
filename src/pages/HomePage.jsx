import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Hero from "../components/landing/Hero";
import BotShowcaseSection from "../components/landing/BotShowcaseSection";
import IntroSection from "../components/landing/IntroSection";
import ServicesSection from "../components/landing/ServicesSection";
import ChatSection from "../components/landing/ChatSection";
import TrustSection from "../components/landing/TrustSection";
import FinalCta from "../components/landing/FinalCta";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BotShowcaseSection />
        <IntroSection />
        <ServicesSection />
        <ChatSection />
        <TrustSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
