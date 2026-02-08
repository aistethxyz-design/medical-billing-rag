import { QrCode, MessageSquare, Globe, BookOpen, Clock, BarChart3, Check } from "lucide-react";

const BusinessDivisionSection = () => {
  return (
    <section id="business-division" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm tracking-[0.2em] uppercase mb-2 block font-sans">WiserDoc Business Division</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">AI Copilots for the Modern Workplace</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Our specialized Business Division provides targeted AI solutions to streamline customer interactions and internal operations.
          </p>
        </div>

        {/* Customer Support Segment */}
        <div id="customer-service" className="mb-24 scroll-mt-24">
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-px flex-grow bg-slate-200"></div>
            <h3 className="text-2xl font-bold text-slate-800 px-4">Customer Support Segment</h3>
            <div className="h-px flex-grow bg-slate-200"></div>
          </div>
          
          <div className="text-center mb-12">
            <h4 className="text-3xl font-bold text-slate-900 mb-4">Customer Support AI Copilot</h4>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Transform customer experience with accurate responses using your store’s own docs, policies, and FAQs, accessible via a QR code at your storefront.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 transition hover:shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <QrCode className="h-6 w-6" />
              </div>
              <h5 className="text-xl font-bold mb-2">QR Code Access</h5>
              <p className="text-slate-600 text-sm">Customers scan and chat instantly at your concierge or any location</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 transition hover:shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h5 className="text-xl font-bold mb-2">Unlimited Conversations</h5>
              <p className="text-slate-600 text-sm">No message limits, continuous learning from common queries</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 transition hover:shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Globe className="h-6 w-6" />
              </div>
              <h5 className="text-xl font-bold mb-2">Multi-Platform</h5>
              <p className="text-slate-600 text-sm">Text/SMS, WhatsApp, not just Telegram</p>
            </div>
          </div>
        </div>

        {/* Employee Training Segment */}
        <div id="employee-training" className="scroll-mt-24">
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-px flex-grow bg-slate-200"></div>
            <h3 className="text-2xl font-bold text-slate-800 px-4">Employee Training Segment</h3>
            <div className="h-px flex-grow bg-slate-200"></div>
          </div>

          <div className="text-center mb-12">
            <h4 className="text-3xl font-bold text-slate-900 mb-4">Employee Training AI Copilot</h4>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Train faster, provide on‑the‑job answers powered by your own SOPs and manuals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center transition hover:shadow-md">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-7 w-7" />
              </div>
              <h5 className="text-xl font-bold mb-3">Custom Knowledge Base</h5>
              <p className="text-slate-600 text-sm">Upload your training manuals, SOPs, and policies for the AI to learn from.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center transition hover:shadow-md">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="h-7 w-7" />
              </div>
              <h5 className="text-xl font-bold mb-3">24/7 Access</h5>
              <p className="text-slate-600 text-sm">Employees get instant, accurate answers anytime without waiting for managers.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center transition hover:shadow-md">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h5 className="text-xl font-bold mb-3">Track Progress</h5>
              <p className="text-slate-600 text-sm">Get analytics on training engagement and identify critical knowledge gaps.</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h5 className="text-2xl font-bold text-slate-900 mb-6">Key Use Cases</h5>
                <ul className="space-y-4">
                  {[
                    "New employee onboarding",
                    "Ongoing skills development",
                    "Policy and compliance training",
                    "Technical procedure lookups"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-3 text-slate-700">
                      <div className="bg-primary/10 p-1 rounded-full">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <a 
                  href="https://tally.so/r/VLPpyE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-block px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 text-center"
                >
                  Request Demo
                </a>
              </div>
              <div className="relative">
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <div className="h-8 bg-primary/10 rounded-lg w-32"></div>
                        <div className="h-8 bg-slate-100 rounded-lg w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 bg-slate-900 text-white p-5 rounded-[1.5rem] shadow-2xl transform rotate-3">
                  <p className="text-[10px] font-bold uppercase mb-1 opacity-50">Training Accuracy</p>
                  <p className="text-3xl font-bold tracking-tighter text-primary">99.8%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessDivisionSection;
