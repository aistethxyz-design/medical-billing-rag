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
    <section className="relative bg-hero-gradient overflow-hidden" data-testid="hero-section">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-8">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight" data-testid="hero-headline">
              Smarter Practice for the Modern Physician
            </h1>
            <p className="text-xl text-slate-200 mb-8 leading-relaxed" data-testid="hero-subheadline">
              The all-in-one pocket AI assistant for clinicians: cut down on admin, get instant lookups, and master your billing - right from your existing workflows.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="https://t.me/TestAIstethbot"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all transform hover:scale-105 shadow-lg"
                data-testid="button-voice-agent"
              >
                <i className="fab fa-telegram"></i>
                <span>Try our AI RAG technology on Telegram</span>
              </a>
              
              <a 
                href="mailto:aistethxyz@gmail.com" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all"
                data-testid="button-contact-email"
              >
                <i className="fas fa-envelope"></i>
                <span>Contact Us</span>
              </a>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center" data-testid="hero-mockup">
            {/* View transition container */}
            <div className="relative w-full" style={{ minHeight: '500px' }}>
              {/* Mobile Assistant View */}
              <div 
                className={`absolute inset-0 transition-opacity duration-700 ${currentView === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <div className="bg-card rounded-2xl shadow-2xl p-6 max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <i className="fas fa-stethoscope text-primary-foreground text-sm"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AISTETH</h3>
                    <p className="text-sm text-muted-foreground">AI-Powered Medical Assistant</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-md text-blue-600"></i>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6 bg-blue-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="stat-tasks">24</div>
                  <div className="text-xs text-muted-foreground">Today's Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="stat-lookups">12</div>
                  <div className="text-xs text-muted-foreground">Lookups</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary" data-testid="stat-codes">8</div>
                  <div className="text-xs text-muted-foreground">Codes Found</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground mb-3">AI Assistants</h4>
                
                <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg relative" data-testid="assistant-admin">
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    Coming Soon
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar text-blue-600"></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Schedule Email or Reminder</h5>
                    <p className="text-xs text-muted-foreground">Admin Assistant - Manage appointments</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-orange-600 flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                        In Development
                      </span>
                      <span className="text-xs text-muted-foreground">3 pending</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg" data-testid="assistant-shift">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-pills text-green-600"></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Look Something Up</h5>
                    <p className="text-xs text-muted-foreground">Shift Assistant - Drug dosages, protocols</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        AI Ready
                      </span>
                      <span className="text-xs text-muted-foreground">Last used 2h ago</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg relative" data-testid="assistant-billing">
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                    Free Trial
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-file-invoice-dollar text-purple-600"></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Optimize OHIP Codes</h5>
                    <p className="text-xs text-muted-foreground">Billing Assistant - Revenue optimization</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-green-600 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        AI Ready
                      </span>
                      <span className="text-xs text-muted-foreground">Try for free</span>
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
