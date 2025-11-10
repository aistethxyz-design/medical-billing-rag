import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ValueProposition from "@/components/ValueProposition";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Security from "@/components/Security";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ValueProposition />
      <Features />
      <Pricing />
      <Security />
      <FinalCTA />
      <Footer />
    </div>
  );
}
