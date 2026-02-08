const HeroSection = () => {
  return (
    <section className="hero-gradient py-16 md:py-24 section-spacing">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-primary font-bold text-lg mb-2 uppercase tracking-wider">WiserDoc</h1>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
          AI-Powered Solutions for Modern Businesses
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
          Empower your business with cutting-edge RAG AI technology for customer service, employee training, and healthcare. Control everything with your own documents and information.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a 
            href="https://tally.so/r/VLPpyE"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-primary/90 transition shadow-lg"
          >
            Get My Free Demo
          </a>
          <a 
            href="https://www.youtube.com/@WiserDoc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 border border-primary text-base font-medium rounded-full text-primary bg-white hover:bg-primary-50 transition shadow-lg"
          >
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
