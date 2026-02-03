import { useState } from "react";
import { useLocation } from "wouter";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2" data-testid="logo">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-stethoscope text-primary-foreground text-sm"></i>
            </div>
            <span className="text-xl font-bold text-primary">AISTETH</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8" data-testid="desktop-nav">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-features"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-pricing"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-testimonials"
            >
              Testimonials
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-contact"
            >
              Contact
            </button>
            <button
              onClick={() => setLocation('/login')}
              className="!bg-blue-600 hover:!bg-blue-500 !text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl ml-4"
              data-testid="nav-login"
              style={{ 
                backgroundColor: '#2563eb',
                color: 'white',
                minWidth: '80px'
              }}
            >
              Login
            </button>
          </nav>
          
          <button 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            <i className="fas fa-bars text-primary"></i>
          </button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border" data-testid="mobile-nav">
            <nav className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
                data-testid="mobile-nav-features"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
                data-testid="mobile-nav-pricing"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
                data-testid="mobile-nav-testimonials"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-muted-foreground hover:text-foreground transition-colors text-left"
                data-testid="mobile-nav-contact"
              >
                Contact
              </button>
              <button
                onClick={() => {
                  setLocation('/login');
                  setIsMobileMenuOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-medium transition-colors w-full shadow-sm"
                data-testid="mobile-nav-login"
                style={{ backgroundColor: 'hsl(221, 83%, 53%)' }}
              >
                Login
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
