import { Star } from "lucide-react";

const ResultsSection = () => {
  const testimonials = [
    {
      name: "Dr. Sarah M.",
      role: "Family Physician",
      content: "AISTETH has completely changed how I manage my practice. The billing agent alone saved me hours of administrative work and increased my revenue significantly.",
      avatar: "SM"
    },
    {
      name: "Marcus C.",
      role: "Retail Store Owner",
      content: "Our customer service response time dropped from hours to seconds. The QR code access at our storefront is a game-changer for customer engagement.",
      avatar: "MC"
    },
    {
      name: "Elena R.",
      role: "Operations Manager",
      content: "The employee training platform is intuitive and powerful. Onboarding new staff used to take weeks; now they're up to speed in days thanks to WiserDoc.",
      avatar: "ER"
    }
  ];

  return (
    <section id="results" className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Real Results from Real People and Businesses</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            See how WiserDoc is empowering professionals across industries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 italic mb-8 flex-grow">"{t.content}"</p>
              <div className="flex items-center space-x-4 pt-6 border-t border-slate-100">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{t.name}</h4>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
