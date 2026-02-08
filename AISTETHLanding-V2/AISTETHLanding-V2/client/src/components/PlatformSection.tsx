import { useState } from "react";
import { Shield, Zap, Share2, MessageSquare, Phone, Laptop } from "lucide-react";
import ragImg from "@/assets/rag_engine.jpg";

const PlatformSection = () => {
  const [isExpanded, setIsVisible] = useState(false);

  const features = [
    {
      title: "Enhanced RAG Engine",
      desc: "Our proprietary Retrieval-Augmented Generation engine ensures your AI stays grounded in your specific documents, providing accurate and context-aware responses.",
      icon: <Zap className="h-6 w-6" />,
    },
    {
      title: "Enterprise-Grade Security",
      desc: "Your documents are encrypted and processed in secure, isolated environments. We prioritize data privacy and compliance for your business information.",
      icon: <Shield className="h-6 w-6" />,
    },
    {
      title: "Seamless Integrations",
      desc: "Deploy your AI where your customers are. Native support for Telegram, SMS/Text, and WebApp Dashboards ensures a frictionless experience across all platforms.",
      icon: <Share2 className="h-6 w-6" />,
    },
  ];

  return (
    <section id="platform" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The All-In-One AI Platform</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Powered by advanced document-enhanced RAG technology to transform your business intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-slate-900 rounded-[2rem] p-8 md:p-12 text-white overflow-hidden relative">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-6">Multi-Channel Deployment</h3>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Reach your audience anywhere. WiserDoc integrates directly with the world's most popular messaging platforms.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">Telegram</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                  <Phone className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                  <MessageSquare className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">SMS / Text</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                  <Laptop className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">WebApp Dashboard</span>
                </div>
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-center">
              <div 
                onClick={() => setIsVisible(!isExpanded)}
                className={`relative cursor-pointer transition-all duration-500 ease-in-out z-20 ${isExpanded ? 'scale-150' : 'scale-100 hover:scale-105'}`}
              >
                <img 
                  src={ragImg} 
                  alt="RAG Engine Visualization" 
                  className="rounded-2xl shadow-2xl border border-white/10 max-w-full h-auto"
                />
              </div>
              {!isExpanded && (
                <p className="mt-6 text-sm font-bold tracking-widest uppercase opacity-50 relative z-10">RAG Engine Active</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformSection;
