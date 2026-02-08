import { 
  Calendar, 
  FileText, 
  DollarSign, 
  Check 
} from "lucide-react";

const FeatureCard = ({ 
  title, 
  description, 
  icon, 
  features, 
  buttonColor = "bg-primary", 
  iconBgColor = "bg-primary-100", 
  iconColor = "text-primary", 
  tag
}: { 
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  buttonColor?: string;
  iconBgColor?: string;
  iconColor?: string;
  tag?: string;
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 relative">
      {tag && (
        <div className="absolute top-0 right-0 bg-[hsl(var(--success))] text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
          {tag}
        </div>
      )}
      <div className="p-6">
        <div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center mb-4`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600">
          {description}
        </p>
        <ul className="mt-4 space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-primary mr-2 mt-1" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="px-6 py-4 bg-slate-50">
        <button className={`w-full ${buttonColor} text-white py-2 px-4 rounded-lg hover:opacity-90 transition`}>
          Learn More
        </button>
      </div>
    </div>
  );
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16 bg-white section-spacing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Detailed Agent Capabilities
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-slate-600">
            Each AI assistant is specialized for specific medical practice needs, designed to integrate seamlessly with your existing workflow
          </p>
        </div>

        <div className="mt-16 grid gap-8 grid-cols-1 md:grid-cols-3">
          {/* Admin Agent Card */}
          <FeatureCard 
            title="Admin Agent"
            description="Handles scheduling, inboxes, and coordination tasks. Automates appointment management and patient communications."
            icon={<Calendar className="h-6 w-6" />}
            features={[
              "Automated scheduling",
              "Inbox management",
              "Patient coordination"
            ]}
          />

          {/* Shift Agent Card */}
          <FeatureCard 
            title="Shift Agent"
            description="Offers dose guidance, specialty-specific reference, and medical knowledge access during shifts."
            icon={<FileText className="h-6 w-6" />}
            buttonColor="bg-accent"
            iconBgColor="bg-accent-100"
            iconColor="text-accent"
            features={[
              "Drug dosage guidance",
              "Clinical protocols",
              "Medical references"
            ]}
          />

          {/* Billing Agent Card */}
          <FeatureCard 
            title="Billing Agent"
            description="Describe a service encounter and get optimal OHIP billing code recommendations to maximize revenue."
            icon={<DollarSign className="h-6 w-6" />}
            buttonColor="bg-[hsl(var(--success))]"
            iconBgColor="bg-[hsl(var(--success)_/_0.2)]"
            iconColor="text-[hsl(var(--success))]"
            features={[
              "OHIP code optimization",
              "Revenue maximization",
              "Billing compliance"
            ]}
            tag="Free Trial Available"
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
