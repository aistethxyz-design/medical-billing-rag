import { useState, useEffect } from "react";

const FloatingSubHeader = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 600; // Approximate hero + platform height
      const resultsSection = document.getElementById("results");
      const resultsOffset = resultsSection ? resultsSection.offsetTop - 100 : 999999;
      
      const isPastHero = window.scrollY > heroHeight;
      const isBeforeResults = window.scrollY < resultsOffset;
      
      setIsVisible(isPastHero && isBeforeResults);

      const healthcare = document.getElementById("healthcare");
      const business = document.getElementById("business-division");
      
      if (business && window.scrollY >= business.offsetTop - 200) {
        setActiveSection("business");
      } else if (healthcare && window.scrollY >= healthcare.offsetTop - 200) {
        setActiveSection("healthcare");
      } else {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-[64px] left-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-center space-x-8 py-3">
          <button 
            onClick={() => scrollTo("healthcare")}
            className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeSection === 'healthcare' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Healthcare Division
          </button>
          <div className="w-px h-4 bg-slate-200 my-auto"></div>
          <button 
            onClick={() => scrollTo("business-division")}
            className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeSection === 'business' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Business Division
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingSubHeader;
