import { MessageCircle } from "lucide-react";
import billingAgentImg from "@/assets/billing_agent.png";
import shiftAgentImg from "@/assets/shift_agent.png";
import adminAgentImg from "@/assets/admin_agent.png";

const AgentDemoCard = ({ 
  title, 
  subtitle, 
  query,
  response,
  image, 
  bgColor, 
  textColor = "text-white",
  tag,
  showTryNow = true
}: { 
  title: string;
  subtitle: string;
  query: string;
  response: string;
  image: string;
  bgColor: string;
  textColor?: string;
  tag?: string;
  showTryNow?: boolean;
}) => {
  return (
    <div className={`${bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative`}>
      {tag && (
        <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-2xl text-xs font-bold">
          {tag}
        </div>
      )}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-white/20">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className={`font-semibold text-lg ${textColor}`}>{title}</h3>
          <p className={`text-sm ${textColor} opacity-90`}>{subtitle}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white/10 rounded-lg p-3 text-xs">
          <p className={`${textColor} opacity-70 mb-1`}>Doctor:</p>
          <p className={`${textColor} font-medium italic`}>"{query}"</p>
        </div>
        <div className="bg-white/20 rounded-lg p-3 text-xs">
          <p className={`${textColor} opacity-70 mb-1`}>AISTETH:</p>
          <p className={`${textColor} leading-relaxed`}>{response}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-end mt-4 pt-4 border-t border-white/10">
        {showTryNow && (
          <a 
            href={title === "Shift Agent" ? "https://t.me/AISteth_EM_intelligence_Bot" : "https://t.me/AISTETH2BOT"}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center space-x-1"
          >
            <MessageCircle className="h-3 w-3" />
            <span>Try Now</span>
          </a>
        )}
      </div>
    </div>
  );
};

const HealthcareSection = () => {
  return (
    <section id="healthcare" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-primary font-bold text-sm tracking-[0.2em] uppercase mb-2 block">Healthcare Division</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">AISTETH: AI Assistant for Physicians</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Smarter Practice for the Modern Physician
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <AgentDemoCard
            title="Admin Agent"
            subtitle="Manage appointments"
            query="Schedule Mrs. Johnson's follow-up for next week"
            response="I've found an available slot on Tuesday, March 12th at 2:30 PM. I'll send the appointment confirmation to Mrs. Johnson and add it to your calendar."
            image={adminAgentImg}
            bgColor="bg-slate-800"
            tag="Available in Platform"
            showTryNow={false}
          />
          <AgentDemoCard
            title="Shift Agent"
            subtitle="Drug dosages, protocols"
            query="Amoxicillin dosage for pediatric patients?"
            response="For pediatric patients, standard amoxicillin dosing is 20-40 mg/kg/day divided into 3 doses. Always verify weight and check for allergies."
            image={shiftAgentImg}
            bgColor="bg-blue-600"
            tag="AI Ready"
          />
          <AgentDemoCard
            title="Billing Agent"
            subtitle="Revenue optimization"
            query="Billing code for routine office visit?"
            response="For a routine office visit, I recommend OHIP code A007A ($77.40) for comprehensive consultation. Based on your description, this visit qualifies."
            image={billingAgentImg}
            bgColor="bg-primary"
            tag="AI Ready"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="https://t.me/AISTETH2BOT" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition shadow-lg"
          >
            Try on Telegram
          </a>
          <a 
            href="https://tally.so/r/3yVLrp"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 border-2 border-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-50 transition text-center"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
};

export default HealthcareSection;
