export default function Features() {
  return (
    <section id="features" className="py-12 lg:py-16 bg-background" data-testid="features-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6" data-testid="features-headline">
            Three Specialized AI Agents
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="features-description">
            Each agent is designed to handle specific aspects of your practice, working seamlessly together.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-shadow relative" data-testid="feature-admin-agent">
            <div className="absolute -top-3 left-6 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Coming Soon
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <i className="fas fa-calendar-alt text-blue-600 text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold mb-4">Admin Agent</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Handles scheduling, inboxes, and coordination tasks. Automates appointment management and patient communications.
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Automated scheduling</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Inbox management</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Patient coordination</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-shadow" data-testid="feature-shift-agent">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <i className="fas fa-pills text-green-600 text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold mb-4">Shift Agent</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Offers dose guidance, specialty-specific reference, and medical knowledge access during shifts.
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Drug dosage guidance</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Clinical protocols</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Medical references</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border hover:shadow-xl transition-shadow relative" data-testid="feature-billing-agent">
            <div className="absolute -top-3 left-6 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Free Trial Available
            </div>
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <i className="fas fa-file-invoice-dollar text-purple-600 text-2xl"></i>
            </div>
            <h3 className="text-2xl font-bold mb-4">Billing Agent</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Describe a service encounter and get optimal OHIP billing code recommendations to maximize revenue.
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>OHIP code optimization</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Revenue maximization</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Billing compliance</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
