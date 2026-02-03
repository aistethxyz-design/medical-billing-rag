import { useEffect, useRef, useState } from "react";

interface FeatureCardProps {
  badge?: string;
  badgeColor: string;
  icon: string;
  iconGradient: string;
  title: string;
  description: string;
  features: string[];
  delay: number;
}

function FeatureCard({ badge, badgeColor, icon, iconGradient, title, description, features, delay }: FeatureCardProps) {
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
      className={`group relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 transition-all duration-700 hover:shadow-2xl hover:-translate-y-3 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {/* Badge */}
      {badge && (
        <div className={`absolute -top-3 left-8 ${badgeColor} text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg z-10`}>
          {badge}
        </div>
      )}
      
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10 blur-md"></div>
      
      {/* Icon */}
      <div className={`w-16 h-16 ${iconGradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
        <i className={`fas ${icon} text-white text-2xl`}></i>
      </div>
      
      {/* Title */}
      <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 mb-6 leading-relaxed">
        {description}
      </p>
      
      {/* Features List */}
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li 
            key={index} 
            className="flex items-center space-x-3 text-gray-700 group/item hover:translate-x-1 transition-transform duration-200"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <i className="fas fa-check text-white text-xs"></i>
            </div>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      {/* Bottom Action */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <button className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 bg-gray-50 text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:shadow-lg group/btn">
          <span className="flex items-center justify-center space-x-2">
            <span>Learn More</span>
            <i className="fas fa-arrow-right group-hover/btn:translate-x-1 transition-transform"></i>
          </span>
        </button>
      </div>
    </div>
  );
}

export default function Features() {
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

  const features = [
    {
      badge: "Coming Soon",
      badgeColor: "bg-gradient-to-r from-orange-500 to-red-500",
      icon: "fa-calendar-alt",
      iconGradient: "bg-gradient-to-br from-orange-400 to-red-500",
      title: "Admin Agent",
      description: "Handles scheduling, inboxes, and coordination tasks. Automates appointment management and patient communications.",
      features: [
        "Automated scheduling & reminders",
        "Smart inbox management",
        "Patient coordination",
        "Workflow automation",
      ],
      delay: 0,
    },
    {
      icon: "fa-pills",
      iconGradient: "bg-gradient-to-br from-green-400 to-emerald-500",
      title: "Shift Agent",
      description: "Offers dose guidance, specialty-specific reference, and medical knowledge access during shifts.",
      features: [
        "Drug dosage guidance",
        "Clinical protocols",
        "Medical references",
        "Real-time lookups",
      ],
      delay: 150,
    },
    {
      badge: "Free Trial Available",
      badgeColor: "bg-gradient-to-r from-blue-500 to-purple-500",
      icon: "fa-file-invoice-dollar",
      iconGradient: "bg-gradient-to-br from-purple-400 to-pink-500",
      title: "Billing Agent",
      description: "Describe a service encounter and get optimal OHIP billing code recommendations to maximize revenue.",
      features: [
        "OHIP code optimization",
        "Revenue maximization",
        "Billing compliance",
        "Audit trail",
      ],
      delay: 300,
    },
  ];

  return (
    <section 
      ref={sectionRef}
      id="features" 
      className="py-24 lg:py-32 bg-white relative overflow-hidden" 
      data-testid="features-section"
    >
      {/* Background Decorations */}
      <div className="absolute top-1/4 right-0 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-purple-100/30 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className={`text-center mb-20 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-4 py-2 mb-6">
            <i className="fas fa-robot text-emerald-600"></i>
            <span className="text-emerald-700 text-sm font-semibold">AI-Powered Agents</span>
          </div>
          
          <h2 
            className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6" 
            data-testid="features-headline"
          >
            Three Specialized{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              AI Agents
            </span>
          </h2>
          <p 
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed" 
            data-testid="features-description"
          >
            Each agent is designed to handle specific aspects of your practice, working seamlessly together to transform your workflow.
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
        
        {/* Integration Note */}
        <div className={`mt-16 text-center transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-2xl px-8 py-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <i className="fas fa-calendar text-white text-xs"></i>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                <i className="fas fa-pills text-white text-xs"></i>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center border-2 border-white">
                <i className="fas fa-file-invoice-dollar text-white text-xs"></i>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Seamless Integration</p>
              <p className="text-xs text-gray-500">All agents work together as one unified system</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
