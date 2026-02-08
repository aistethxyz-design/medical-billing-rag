import { Upload, Settings, Rocket } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      title: "Upload Your Documents",
      desc: "Training manuals, FAQs, business info, or medical guidelines. We process everything securely.",
      icon: <Upload className="h-8 w-8" />,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Customize Your AI",
      desc: "Set tone, branding, response parameters, and specific instructions for your AI agents.",
      icon: <Settings className="h-8 w-8" />,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      title: "Deploy Instantly",
      desc: "Get your unique QR codes, links, or direct integrations for Telegram, SMS, or WhatsApp.",
      icon: <Rocket className="h-8 w-8" />,
      color: "text-green-600",
      bg: "bg-green-50"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Get your business-specific AI running in minutes
          </p>
        </div>

        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 ${step.bg} ${step.color} rounded-full flex items-center justify-center mb-6 shadow-md border-4 border-white`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{idx + 1}. {step.title}</h3>
                <p className="text-slate-600 max-w-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
