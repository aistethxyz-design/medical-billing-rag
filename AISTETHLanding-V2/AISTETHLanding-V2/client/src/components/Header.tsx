import { useState, useEffect } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { Link } from "wouter";

import logoImg from "@/assets/logo.jpg";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavLinkClick = (id: string) => {
    setMobileMenuOpen(false);
    setSolutionsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-md py-2' : 'py-4'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img src={logoImg} alt="WiserDoc Logo" className="h-10 w-auto rounded-lg" />
              <span className="text-primary font-bold text-2xl tracking-tight">WiserDoc</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#platform" onClick={(e) => { e.preventDefault(); handleNavLinkClick('platform'); }} className="text-slate-600 hover:text-primary font-medium text-sm transition">Platform</a>
            
            <div className="relative group">
              <button 
                onMouseEnter={() => setSolutionsOpen(true)}
                className="flex items-center space-x-1 text-slate-600 hover:text-primary font-medium text-sm transition"
              >
                <span>Solutions</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              <div 
                onMouseLeave={() => setSolutionsOpen(false)}
                className={`absolute top-full left-0 w-64 bg-white shadow-2xl rounded-2xl p-4 border border-slate-100 transition-all duration-200 transform origin-top-left ${solutionsOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
              >
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">AISTETH (Healthcare)</p>
                    <a href="#healthcare" onClick={(e) => { e.preventDefault(); handleNavLinkClick('healthcare'); }} className="block px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm">
                      <span className="block font-bold text-slate-900">For Residents & Doctors</span>
                      <span className="text-xs text-slate-500">Billing & shift automation</span>
                    </a>
                    <a href="#healthcare" onClick={(e) => { e.preventDefault(); handleNavLinkClick('healthcare'); }} className="block px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm">
                      <span className="block font-bold text-slate-900">For Clinics & Hospitals</span>
                      <span className="text-xs text-slate-500">Full facility AI integration</span>
                    </a>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-3">WiserDoc Business</p>
                    <a href="#customer-service" onClick={(e) => { e.preventDefault(); handleNavLinkClick('customer-service'); }} className="block px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm">
                      <span className="block font-bold text-slate-900">For Store Fronts</span>
                      <span className="text-xs text-slate-500">QR-code customer service</span>
                    </a>
                    <a href="#employee-training" onClick={(e) => { e.preventDefault(); handleNavLinkClick('employee-training'); }} className="block px-3 py-2 rounded-lg hover:bg-slate-50 transition text-sm">
                      <span className="block font-bold text-slate-900">For Employee Training</span>
                      <span className="text-xs text-slate-500">Automated onboarding</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <a href="#results" onClick={(e) => { e.preventDefault(); handleNavLinkClick('results'); }} className="text-slate-600 hover:text-primary font-medium text-sm transition">Results</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); handleNavLinkClick('pricing'); }} className="text-slate-600 hover:text-primary font-medium text-sm transition">Pricing</a>
            <a href="#footer" onClick={(e) => { e.preventDefault(); handleNavLinkClick('footer'); }} className="text-slate-600 hover:text-primary font-medium text-sm transition">Contact</a>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            <a 
              href="/app/login"
              className="text-slate-600 hover:text-primary font-bold text-sm"
            >
              Sign In
            </a>
            <a 
              href="https://zcal.co/aisteth/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
            >
              Talk to an Expert
            </a>
          </div>
          
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-900"><Menu /></button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-slate-100 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'}`}>
        <div className="p-4 space-y-4">
          <a href="#platform" onClick={(e) => { e.preventDefault(); handleNavLinkClick('platform'); }} className="block font-bold text-slate-900">Platform</a>
          <div className="pl-4 space-y-3 border-l-2 border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solutions</p>
            <a href="#healthcare" onClick={(e) => { e.preventDefault(); handleNavLinkClick('healthcare'); }} className="block text-sm">Healthcare (AISTETH)</a>
            <a href="#customer-service" onClick={(e) => { e.preventDefault(); handleNavLinkClick('customer-service'); }} className="block text-sm">Business Store Fronts</a>
            <a href="#employee-training" onClick={(e) => { e.preventDefault(); handleNavLinkClick('employee-training'); }} className="block text-sm">Employee Training</a>
          </div>
          <a href="#results" onClick={(e) => { e.preventDefault(); handleNavLinkClick('results'); }} className="block font-bold text-slate-900">Results</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); handleNavLinkClick('pricing'); }} className="block font-bold text-slate-900">Pricing</a>
          <a href="#footer" onClick={(e) => { e.preventDefault(); handleNavLinkClick('footer'); }} className="block font-bold text-slate-900">Contact</a>
          <div className="pt-4 grid grid-cols-2 gap-4">
            <a 
              href="/app/login"
              className="py-3 rounded-xl border border-slate-200 font-bold text-sm text-center"
            >
              Sign In
            </a>
            <a 
              href="https://zcal.co/aisteth/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 rounded-xl bg-primary text-white font-bold text-sm text-center"
            >
              Expert
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
