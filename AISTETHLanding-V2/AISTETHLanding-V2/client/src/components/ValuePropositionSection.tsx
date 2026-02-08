import { 
  Clock, 
  DollarSign, 
  ClipboardList, 
  Shield 
} from "lucide-react";

const ValuePropositionSection = () => {
  return (
    <section className="py-16 bg-white section-spacing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Minimize Costs, Maximize Revenue
          </h2>
          <p className="mt-4 text-xl text-slate-600">
            Save hundreds to thousands of dollars by reducing admin overhead and capturing missed billing opportunities.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
          <div className="bg-slate-50 rounded-xl p-8 shadow-md hover:shadow-lg transition">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-slate-900">Reduce Administrative Overhead</h3>
                <p className="mt-2 text-slate-600">Our AI assistants handle scheduling, paperwork, and coordination tasks, saving you valuable time and reducing the need for administrative staff.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 shadow-md hover:shadow-lg transition">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[hsl(var(--success))] text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-slate-900">Optimize Billing Revenue</h3>
                <p className="mt-2 text-slate-600">Identify missed billing opportunities and recommend optimal OHIP billing codes, ensuring you capture the full revenue for the services you provide.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 shadow-md hover:shadow-lg transition">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-accent text-white">
                  <ClipboardList className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-slate-900">Seamless Integration</h3>
                <p className="mt-2 text-slate-600">Integrates with the tools you already use, including your mobile and messaging apps, ensuring a smooth workflow without disrupting your existing processes.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-8 shadow-md hover:shadow-lg transition">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-slate-900">Privacy-First Approach</h3>
                <p className="mt-2 text-slate-600">Designed with privacy in mind, ensuring that your patient data remains secure and compliant with healthcare regulations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionSection;
