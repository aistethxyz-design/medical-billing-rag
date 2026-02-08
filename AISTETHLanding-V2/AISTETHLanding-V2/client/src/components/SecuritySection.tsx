import { Server, Lock, Shield, FileText } from "lucide-react";

const SecurityCard = ({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">
        {description}
      </p>
    </div>
  );
};

const SecuritySection = () => {
  return (
    <section id="security" className="py-16 bg-slate-50 section-spacing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Enterprise-Grade Security
          </h2>
          <p className="mt-4 text-xl text-slate-600">
            Your data privacy and security are our top priorities.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-8">
            <SecurityCard 
              title="Enterprise-Grade Security" 
              description="Your data security is our top priority. Complete privacy and compliance with healthcare regulations through isolated infrastructure and strict data protection."
              icon={<Shield className="h-6 w-6" />}
            />
            <SecurityCard 
              title="Data Privacy" 
              description="Your data is never resold or shared without your explicit consent, ensuring complete confidentiality and trust."
              icon={<Lock className="h-6 w-6" />}
            />
          </div>
          <div className="bg-primary-900 text-white p-8 rounded-2xl shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <Server className="h-6 w-6 mr-2" />
              Infrastructure
            </h3>
            <p className="text-primary-100 leading-relaxed">
              Hosted on secure, high-performance infrastructure with regular backups and multi-layer protection. We ensure high availability so AISTETH is always ready when you are.
            </p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-center text-sm text-primary-200">
                <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                Isolated data storage
              </li>
              <li className="flex items-center text-sm text-primary-200">
                <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                Encrypted communications
              </li>
              <li className="flex items-center text-sm text-primary-200">
                <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2"></div>
                Regulatory compliance
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="inline-flex items-center justify-center px-6 py-3 border border-primary text-base font-medium rounded-full text-primary bg-white hover:bg-primary-50 transition shadow-md">
            <FileText className="h-5 w-5 mr-2" />
            Download Security Whitepaper
          </button>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
