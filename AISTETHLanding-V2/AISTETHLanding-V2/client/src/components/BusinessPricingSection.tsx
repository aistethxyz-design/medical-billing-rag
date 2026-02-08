import { Check } from "lucide-react";

const BusinessPricingSection = () => {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-900">Get Started with WiserDoc Business</h2>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white rounded-2xl shadow-lg border border-slate-100 flex flex-col">
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Free Trial</span>
            <h4 className="text-2xl font-bold mb-4">Lite</h4>
            <ul className="space-y-4 text-sm text-slate-600 flex-grow mb-8">
              <li className="flex items-center"><Check className="h-4 w-4 text-primary mr-3" /> 10 customer queries</li>
              <li className="flex items-center"><Check className="h-4 w-4 text-primary mr-3" /> Telegram Access</li>
              <li className="flex items-center"><Check className="h-4 w-4 text-primary mr-3" /> QR sticker delivered</li>
            </ul>
            <a 
              href="https://tally.so/r/VLPpyE"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition text-center"
            >
              Try Free
            </a>
          </div>

          <div className="p-8 bg-white rounded-2xl shadow-xl border-2 border-primary flex flex-col relative">
            <div className="absolute -top-3 right-6 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full">POPULAR</div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Premium Plan</span>
            <h4 className="text-3xl font-bold mb-1">$39.99<span className="text-sm font-normal text-slate-500">/mo</span></h4>
            <ul className="space-y-4 text-sm text-slate-600 flex-grow mb-8 mt-4">
              <li className="flex items-center"><Check className="h-4 w-4 text-primary mr-3" /> QR Code, or text initiated Interaction</li>
              <li className="flex items-center"><Check className="h-4 w-4 text-primary mr-3" /> Customer Service or Employee training Agent</li>
              <li className="flex items-center"><Check className="h-4 w-4 text-primary mr-3" /> Train AI with your documents</li>
            </ul>
            <a 
              href="https://tally.so/r/VLPpyE"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20 text-center"
            >
              Start Trial
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessPricingSection;
