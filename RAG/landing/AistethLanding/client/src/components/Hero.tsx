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
    <section className="relative min-h-screen overflow-hidden" data-testid="hero-section">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-hero-gradient"></div>
      
      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 bg-mesh-gradient"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl float"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl float-delayed"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl"></div>
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Text */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 glass rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white/90 text-sm font-medium">AI-Powered Medical Assistant</span>
            </div>
            
            {/* Headline */}
            <h1 
              className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight" 
              data-testid="hero-headline"
            >
              Smarter Practice for the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300">
                Modern Physician
              </span>
            </h1>
            
            {/* Subheadline */}
            <p 
              className="text-xl lg:text-2xl text-white/80 mb-8 leading-relaxed max-w-xl" 
              data-testid="hero-subheadline"
            >
              The all-in-one pocket AI assistant for clinicians: cut down on admin, get instant lookups, and master your billing — right from your existing workflows.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="https://t.me/TestAIstethbot"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all duration-300 hover:shadow-2xl hover:shadow-white/25 hover:-translate-y-1"
                data-testid="button-voice-agent"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <i className="fab fa-telegram text-xl relative z-10"></i>
                <span className="relative z-10">Try AI on Telegram</span>
                <i className="fas fa-arrow-right relative z-10 group-hover:translate-x-1 transition-transform"></i>
              </a>
              
              <a 
                href="mailto:aistethxyz@gmail.com" 
                className="group glass text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all duration-300 hover:bg-white/20 hover:-translate-y-1"
                data-testid="button-contact-email"
              >
                <i className="fas fa-envelope text-lg"></i>
                <span>Contact Us</span>
              </a>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start space-x-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-white/60 text-sm">Physicians</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-white/60 text-sm">Codes Processed</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-white/60 text-sm">Uptime</div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Mockup */}
          <div className="relative flex items-center justify-center" data-testid="hero-mockup">
            {/* Glow Effect Behind Mockup */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl scale-110"></div>
            
            {/* View transition container */}
            <div className="relative w-full" style={{ minHeight: '520px' }}>
              {/* Mobile Assistant View */}
              <div 
                className={`absolute inset-0 transition-all duration-700 ${currentView === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
              >
                <div className="glass-card rounded-3xl p-6 max-w-sm mx-auto float">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <i className="fas fa-stethoscope text-white text-sm"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">AISTETH</h3>
                        <p className="text-xs text-muted-foreground">AI Medical Assistant</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                      <i className="fas fa-user-md text-blue-600"></i>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600" data-testid="stat-tasks">24</div>
                      <div className="text-xs text-muted-foreground">Tasks</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center shadow-sm">
                      <div className="text-2xl font-bold text-purple-600" data-testid="stat-lookups">12</div>
                      <div className="text-xs text-muted-foreground">Lookups</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center shadow-sm">
                      <div className="text-2xl font-bold text-green-600" data-testid="stat-codes">8</div>
                      <div className="text-xs text-muted-foreground">Codes</div>
                    </div>
                  </div>
                  
                  {/* AI Assistants */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide text-muted-foreground">AI Assistants</h4>
                    
                    {/* Admin Assistant */}
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl relative shadow-sm hover:shadow-md transition-shadow" data-testid="assistant-admin">
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Coming Soon
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center shadow-md">
                        <i className="fas fa-calendar text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm">Schedule & Reminders</h5>
                        <p className="text-xs text-muted-foreground">Admin Assistant</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-orange-600 flex items-center font-medium">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-1 animate-pulse"></div>
                            In Development
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Shift Assistant */}
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm hover:shadow-md transition-shadow" data-testid="assistant-shift">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                        <i className="fas fa-pills text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm">Clinical Lookup</h5>
                        <p className="text-xs text-muted-foreground">Shift Assistant</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-green-600 flex items-center font-medium">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            AI Ready
                          </span>
                          <span className="text-xs text-muted-foreground">2h ago</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Billing Assistant */}
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl relative shadow-sm hover:shadow-md transition-shadow" data-testid="assistant-billing">
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Free Trial
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                        <i className="fas fa-file-invoice-dollar text-white"></i>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm">OHIP Optimization</h5>
                        <p className="text-xs text-muted-foreground">Billing Assistant</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-green-600 flex items-center font-medium">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            AI Ready
                          </span>
                          <span className="text-xs text-purple-600 font-medium">Try free</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard View */}
              <div 
                className={`absolute inset-0 transition-all duration-700 ${currentView === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
              >
                <div className="glass-card rounded-3xl p-6 max-w-xl mx-auto float-delayed">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <i className="fas fa-stethoscope text-white text-sm"></i>
                      </div>
                      <span className="font-bold text-lg text-foreground">AISteth</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                        <i className="fas fa-user-md text-blue-600 text-sm"></i>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Title */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-1">Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Welcome back! Here's your practice overview.</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium">Revenue</span>
                        <i className="fas fa-dollar-sign text-green-500"></i>
                      </div>
                      <div className="text-2xl font-bold text-foreground">$12,450</div>
                      <div className="text-xs text-green-600 flex items-center mt-1 font-medium">
                        <i className="fas fa-arrow-up mr-1"></i>
                        +15.3%
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium">Codes</span>
                        <i className="fas fa-file-medical text-blue-500"></i>
                      </div>
                      <div className="text-2xl font-bold text-foreground">247</div>
                      <div className="text-xs text-green-600 flex items-center mt-1 font-medium">
                        <i className="fas fa-arrow-up mr-1"></i>
                        +8.2%
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground font-medium">Optimization</span>
                        <i className="fas fa-chart-line text-purple-500"></i>
                      </div>
                      <div className="text-2xl font-bold text-foreground">78%</div>
                      <div className="text-xs text-green-600 flex items-center mt-1 font-medium">
                        <i className="fas fa-arrow-up mr-1"></i>
                        +5.1%
                      </div>
                    </div>
                  </div>

                  {/* Recent Optimizations */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide text-muted-foreground">Recent Optimizations</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">99213</span>
                            <i className="fas fa-arrow-right text-muted-foreground text-xs"></i>
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg">99214</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Pending</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">+$45.00</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">99212</span>
                            <i className="fas fa-arrow-right text-muted-foreground text-xs"></i>
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg">99213</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Approved</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">+$32.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicator Dots */}
            <div className="flex justify-center mt-8 space-x-3">
              <button
                onClick={() => setCurrentView(0)}
                className={`h-2 rounded-full transition-all duration-300 ${currentView === 0 ? 'bg-white w-10 shadow-glow' : 'bg-white/40 w-2 hover:bg-white/60'}`}
                aria-label="View 1"
              />
              <button
                onClick={() => setCurrentView(1)}
                className={`h-2 rounded-full transition-all duration-300 ${currentView === 1 ? 'bg-white w-10 shadow-glow' : 'bg-white/40 w-2 hover:bg-white/60'}`}
                aria-label="View 2"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
