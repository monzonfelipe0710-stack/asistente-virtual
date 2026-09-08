import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Hero from "../components/landing/Hero";
import Marquee from "../components/landing/Marquee";
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
        <Marquee />
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