import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 transition-all duration-300" data-testid="header">
      <div className="glass-card border-0 border-b border-white/10 backdrop-blur-xl bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3" data-testid="logo">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-stethoscope text-white text-lg"></i>
              </div>
              <span className="text-2xl font-bold gradient-text">AISTETH</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8" data-testid="desktop-nav">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium hover:scale-105"
                data-testid="nav-features"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium hover:scale-105"
                data-testid="nav-pricing"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium hover:scale-105"
                data-testid="nav-testimonials"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-blue-600 transition-all duration-200 font-medium hover:scale-105"
                data-testid="nav-contact"
              >
                Contact
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-fancy bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl glow-blue"
                data-testid="nav-login"
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-sign-in-alt"></i>
                  Login
                </span>
              </button>
            </nav>
            
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              <i className={`fas transition-transform duration-300 text-xl ${isMobileMenuOpen ? 'fa-times rotate-180' : 'fa-bars'} text-gray-600`}></i>
            </button>
          </div>
          
          {isMobileMenuOpen && (
            <div className="md:hidden py-6 border-t border-white/20 animate-fade-in" data-testid="mobile-nav">
              <nav className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-gray-600 hover:text-blue-600 transition-colors text-left py-2 font-medium"
                  data-testid="mobile-nav-features"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="text-gray-600 hover:text-blue-600 transition-colors text-left py-2 font-medium"
                  data-testid="mobile-nav-pricing"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="text-gray-600 hover:text-blue-600 transition-colors text-left py-2 font-medium"
                  data-testid="mobile-nav-testimonials"
                >
                  Testimonials
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-600 hover:text-blue-600 transition-colors text-left py-2 font-medium"
                  data-testid="mobile-nav-contact"
                >
                  Contact
                </button>
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="btn-fancy bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all w-full shadow-lg mt-4"
                  data-testid="mobile-nav-login"
                >
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-sign-in-alt"></i>
                    Login
                  </span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
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
                  navigate('/login');
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
