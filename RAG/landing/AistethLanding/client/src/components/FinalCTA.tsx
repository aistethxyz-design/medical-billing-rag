export default function FinalCTA() {

  return (
    <section className="py-12 lg:py-16 bg-gradient-to-r from-primary to-slate-800" data-testid="final-cta-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6" data-testid="final-cta-headline">
          Ready to Start a Conversation?
        </h2>
        <p className="text-xl text-slate-200 mb-12 max-w-2xl mx-auto" data-testid="final-cta-description">
          Experience how AISTETH can transform your practice. Try our AI agents today and see the difference.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a 
            href="https://t.me/TestAIstethbot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-3 transition-all transform hover:scale-105 shadow-lg"
            data-testid="button-final-voice-agent"
          >
            <i className="fab fa-telegram"></i>
            <span>Try on Telegram</span>
          </a>
          
          <a 
            href="mailto:aistethxyz@gmail.com" 
            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary px-10 py-4 rounded-lg font-semibold text-lg flex items-center justify-center space-x-3 transition-all"
            data-testid="button-final-email"
          >
            <i className="fas fa-envelope"></i>
            <span>Contact Us</span>
          </a>
        </div>
      </div>
    </section>
  );
}
