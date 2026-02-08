import { Check } from "lucide-react";

const PricingSection = () => {
  const tiers = [
    {
      name: "For Solo Physicians",
      price: "9.99",
      period: "/agent/mo",
      desc: "Empower your private practice with specialized medical AI agents.",
      highlight: true,
      features: [
        "Telegram & Text Support",
        "Shift intelligence agent or billing agent",
        "Quick Searches for ER, Critical Care, Procedures, Premiums",
        "HIPAA-Compliant AI Engine",
        "Automatic access to RAG AI improvements",
        "Cancel anytime"
      ]
    },
    {
      name: "Clinics",
      price: "59.99",
      period: "/month",
      desc: "Complete AI infrastructure for medical clinics and hospitals.",
      features: [
        "Platform Access with chat memory, image recognition",
        "Access to all AI Agents",
        "Compare billings to specialty averages",
        "Export Ready Billings",
        "HIPAA-Compliant AI Engine",
        "Automatic access to RAG AI improvements",
        "Cancel anytime"
      ]
    },
    {
      name: "For Businesses",
      price: "39.99",
      period: "/month",
      desc: "Perfect for store fronts and corporate training teams.",
      highlight: true,
      features: [
        "QR Code, or text initiated Interaction",
        "Customer Service or Employee training Agent",
        "Train AI with your documents"
      ]
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Scalable Pricing</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Try any plan with a 10-query free trial. No credit card required to start.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier, i) => (
            <div 
              key={i} 
              className={`p-8 rounded-3xl flex flex-col relative transition ${
                tier.highlight 
                  ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10 border-2 border-primary' 
                  : 'bg-white text-slate-900 border border-slate-100 shadow-lg'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Starter Plan
                </div>
              )}
              <h3 className={`text-xl font-bold mb-2 ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h3>
              <p className={`text-sm mb-6 ${tier.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{tier.desc}</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-4xl font-bold">${tier.price}</span>
                <span className={`text-sm ml-1 ${tier.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{tier.period}</span>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-center space-x-3 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className={tier.highlight ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <a 
                href={tier.name === "For Solo Physicians" ? "https://tally.so/r/3yVLrp" : "https://tally.so/r/VLPpyE"}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3 rounded-xl font-bold transition text-center ${
                  tier.highlight 
                    ? 'bg-primary text-white hover:bg-primary/90' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                Start Free Trial
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
