import { useState, useEffect } from "react";

export default function Hero() {
  const [currentView, setCurrentView] = useState(0);

  // Auto-rotate between views every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentView((prev) => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-hero-gradient overflow-hidden min-h-[90vh] flex items-center" data-testid="hero-section">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-400/10 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white/90">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>AI-Powered Medical Billing Assistant</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight tracking-tight" data-testid="hero-headline">
              <span className="block">Smarter Practice</span>
              <span className="block mt-2">for the <span className="gradient-text-hero">Modern</span></span>
              <span className="block mt-2 gradient-text-hero">Physician</span>
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100/90 mb-8 leading-relaxed max-w-xl" data-testid="hero-subheadline">
              The all-in-one pocket AI assistant for clinicians: cut down on admin, get instant lookups, and master your billing.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="https://t.me/TestAIstethbot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-fancy bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all shadow-xl shadow-blue-500/25 text-lg"
                data-testid="button-voice-agent"
              >
                <i className="fab fa-telegram text-xl"></i>
                <span>Try AI on Telegram</span>
              </a>
              
              <a 
                href="mailto:aistethxyz@gmail.com" 
                className="btn-fancy bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all backdrop-blur-sm"
                data-testid="button-contact-email"
              >
                <i className="fas fa-envelope text-lg"></i>
                <span>Contact Us</span>
              </a>
            </div>
            
            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-8 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <i className="fas fa-shield-alt text-green-400"></i>
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <i className="fas fa-lock text-green-400"></i>
                <span>256-bit Encryption</span>
              </div>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center" data-testid="hero-mockup">
            {/* View transition container */}
            <div className="relative w-full" style={{ minHeight: '600px' }}>
              {/* Mobile Assistant View */}
              <div 
                className={`absolute inset-0 transition-all duration-1000 ${currentView === 0 ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-8 pointer-events-none'}`}
              >
                <div className="glass-card floating-card rounded-3xl shadow-2xl p-8 max-w-md mx-auto relative overflow-hidden">
                  {/* Gradient overlay */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"></div>
                  
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <i className="fas fa-stethoscope text-white text-lg"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">AISTETH</h3>
                        <p className="text-sm text-muted-foreground">AI Medical Assistant</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-inner">
                      <i className="fas fa-user-md text-blue-600 text-xl"></i>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-8 bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-testid="stat-tasks">24</div>
                      <div className="text-xs text-muted-foreground font-medium">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="stat-lookups">12</div>
                      <div className="text-xs text-muted-foreground font-medium">Lookups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" data-testid="stat-codes">8</div>
                      <div className="text-xs text-muted-foreground font-medium">Codes</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full status-pulse"></span>
                      AI Assistants
                    </h4>
                    
                    <div className="card-hover-lift flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl relative border border-orange-100" data-testid="assistant-admin">
                      <div className="badge-warning absolute -top-2 -right-2 text-xs px-3 py-1">
                        Coming Soon
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <i className="fas fa-calendar text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm">Schedule Assistant</h5>
                        <p className="text-xs text-muted-foreground">Manage appointments</p>
                      </div>
                    </div>
                    
                    <div className="card-hover-lift flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100" data-testid="assistant-shift">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <i className="fas fa-pills text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm">Lookup Assistant</h5>
                        <p className="text-xs text-muted-foreground">Drug dosages, protocols</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="badge-success text-xs px-2 py-1">AI Ready</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-hover-lift flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl relative border border-purple-100" data-testid="assistant-billing">
                      <div className="badge-gradient absolute -top-2 -right-2 text-xs px-3 py-1">
                        Free Trial
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <i className="fas fa-file-invoice-dollar text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm">Billing Optimizer</h5>
                        <p className="text-xs text-muted-foreground">Revenue optimization</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="badge-success text-xs px-2 py-1">AI Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard View */}
              <div 
                className={`absolute inset-0 transition-opacity duration-700 ${currentView === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-xl mx-auto">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <i className="fas fa-stethoscope text-primary-foreground text-sm"></i>
                      </div>
                      <span className="font-bold text-lg text-foreground">AISteth</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-user-md text-blue-600 text-sm"></i>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Title */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Welcome back! Here's your practice overview.</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Monthly Revenue</span>
                        <i className="fas fa-dollar-sign text-green-500 text-xs"></i>
                      </div>
                      <div className="text-2xl font-bold text-foreground">$12,450</div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <i className="fas fa-arrow-up mr-1"></i>
                        +15.3%
                      </div>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Codes Processed</span>
                        <i className="fas fa-file-medical text-blue-500 text-xs"></i>
                      </div>
                      <div className="text-2xl font-bold text-foreground">247</div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <i className="fas fa-arrow-up mr-1"></i>
                        +8.2%
                      </div>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Optimization</span>
                        <i className="fas fa-chart-line text-purple-500 text-xs"></i>
                      </div>
                      <div className="text-2xl font-bold text-foreground">78%</div>
                      <div className="text-xs text-green-600 flex items-center mt-1">
                        <i className="fas fa-arrow-up mr-1"></i>
                        +5.1%
                      </div>
                    </div>
                  </div>

                  {/* Recent Optimizations */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-sm">Recent Code Optimizations</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded">99213</span>
                            <i className="fas fa-arrow-right text-muted-foreground text-xs"></i>
                            <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-1 rounded">99214</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
                        </div>
                        <span className="text-sm font-semibold text-green-600">+$45.00</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded">99212</span>
                            <i className="fas fa-arrow-right text-muted-foreground text-xs"></i>
                            <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-1 rounded">99213</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Approved</span>
                        </div>
                        <span className="text-sm font-semibold text-green-600">+$32.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicator Dots */}
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => setCurrentView(0)}
                className={`w-2 h-2 rounded-full transition-all ${currentView === 0 ? 'bg-white w-8' : 'bg-white/50'}`}
                aria-label="View 1"
              />
              <button
                onClick={() => setCurrentView(1)}
                className={`w-2 h-2 rounded-full transition-all ${currentView === 1 ? 'bg-white w-8' : 'bg-white/50'}`}
                aria-label="View 2"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
