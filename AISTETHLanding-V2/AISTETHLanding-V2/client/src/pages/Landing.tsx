import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import PlatformSection from "@/components/PlatformSection";
import HealthcareSection from "@/components/HealthcareSection";
import BusinessDivisionSection from "@/components/BusinessDivisionSection";
import FloatingSubHeader from "@/components/FloatingSubHeader";
import HowItWorksSection from "@/components/HowItWorksSection";
import BusinessPricingSection from "@/components/BusinessPricingSection";
import ResultsSection from "@/components/ResultsSection";
import PricingSection from "@/components/PricingSection";
import FinalCTASection from "@/components/FinalCTASection";
import Footer from "@/components/Footer";

const Landing = () => {
  return (
    <div className="font-sans text-slate-800 antialiased scroll-smooth">
      <Header />
      <FloatingSubHeader />
      <main>
        <HeroSection />
        <PlatformSection />
        <div id="solutions">
          <HealthcareSection />
          <BusinessDivisionSection />
        </div>
        <HowItWorksSection />
        <BusinessPricingSection />
        <ResultsSection />
        <PricingSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
