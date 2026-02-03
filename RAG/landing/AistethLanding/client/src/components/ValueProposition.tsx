import { useEffect, useRef, useState } from "react";

interface ValueCardProps {
  icon: string;
  iconGradient: string;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
  delay: number;
}

function ValueCard({ icon, iconGradient, title, description, stat, statLabel, delay }: ValueCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div 
      ref={cardRef}
      className={`group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {/* Gradient Border on Hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm"></div>
      
      {/* Icon */}
      <div className={`w-16 h-16 ${iconGradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        <i className={`fas ${icon} text-white text-2xl`}></i>
      </div>
      
      {/* Content */}
      <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed mb-6">
        {description}
      </p>
      
      {/* Stat */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gradient">{stat}</span>
          <span className="text-sm text-gray-500">{statLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default function ValueProposition() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const values = [
    {
      icon: "fa-clock",
      iconGradient: "bg-gradient-to-br from-green-400 to-emerald-500",
      title: "Time Savings",
      description: "Reduce administrative tasks by up to 3-4 hours per day with intelligent automation that handles scheduling, documentation, and routine follow-ups.",
      stat: "3-4h",
      statLabel: "saved daily",
      delay: 0,
    },
    {
      icon: "fa-dollar-sign",
      iconGradient: "bg-gradient-to-br from-blue-400 to-cyan-500",
      title: "Cost Reduction",
      description: "Lower overhead costs through streamlined operations and reduced manual work, allowing your staff to focus on patient care.",
      stat: "40%",
      statLabel: "cost reduction",
      delay: 150,
    },
    {
      icon: "fa-chart-line",
      iconGradient: "bg-gradient-to-br from-purple-400 to-pink-500",
      title: "Revenue Optimization",
      description: "Capture missed billing opportunities and optimize OHIP code selection with AI-powered recommendations that maximize reimbursement.",
      stat: "25%",
      statLabel: "revenue increase",
      delay: 300,
    },
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-24 lg:py-32 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden" 
      data-testid="value-proposition-section"
    >
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className={`text-center mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-4 py-2 mb-6">
            <i className="fas fa-sparkles text-purple-600"></i>
            <span className="text-purple-700 text-sm font-semibold">Why Choose AISteth</span>
          </div>
          
          <h2 
            className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6" 
            data-testid="value-headline"
          >
            Save{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Hundreds to Thousands
            </span>
            {" "}of Dollars
          </h2>
          <p 
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed" 
            data-testid="value-description"
          >
            Reduce administrative overhead and capture missed billing opportunities through seamless integration with devices and tools you already use.
          </p>
        </div>
        
        {/* Value Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <ValueCard key={index} {...value} />
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className={`text-center mt-16 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <a 
            href="https://t.me/TestAIstethbot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-blue-600 font-semibold hover:text-purple-600 transition-colors group"
          >
            <span>See how much you can save</span>
            <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </a>
        </div>
      </div>
    </section>
  );
}
