export default function Pricing() {

  return (
    <section id="pricing" className="py-12 lg:py-16 bg-secondary" data-testid="pricing-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6" data-testid="pricing-headline">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground" data-testid="pricing-description">
            Start with a 2-week free trial, then choose the plan that works for you.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Free Trial */}
          <div className="bg-card rounded-2xl p-8 shadow-xl border border-border" data-testid="pricing-trial">
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <i className="fas fa-gift mr-2"></i>
                Free Trial
              </div>
              <h3 className="text-2xl font-bold mb-2">2-Week Trial</h3>
              <div className="text-4xl font-bold text-primary mb-2">Free</div>
              <p className="text-muted-foreground">No credit card required</p>
            </div>
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Full access to all agents</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Complete setup included</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Technical support</span>
              </li>
            </ul>
            <a 
              href="https://zcal.co/aisteth/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              data-testid="button-start-trial"
            >
              Schedule Free Trial
            </a>
          </div>

          {/* Monthly/Annual */}
          <div className="bg-card rounded-2xl p-8 shadow-xl border-2 border-blue-500 relative" data-testid="pricing-subscription">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Subscription</h3>
              <div className="text-4xl font-bold text-primary mb-2">$8.99<span className="text-lg text-muted-foreground font-normal">/month</span></div>
              <p className="text-muted-foreground">Or $99.99 annually (save $7)</p>
            </div>
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>All AI agents included</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Regular updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Priority support</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Cancel anytime</span>
              </li>
            </ul>
            <a 
              href="https://tally.so/r/3yVLrp"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              data-testid="button-subscribe"
            >
              Join Waitlist for Nov Launch
            </a>
          </div>

          {/* Lifetime */}
          <div className="bg-card rounded-2xl p-8 shadow-xl border border-border" data-testid="pricing-lifetime">
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <i className="fas fa-crown mr-2"></i>
                Best Value
              </div>
              <h3 className="text-2xl font-bold mb-2">Lifetime Access</h3>
              <div className="text-4xl font-bold text-primary mb-2">$149.99</div>
              <p className="text-muted-foreground">One-time payment</p>
            </div>
            <ul className="space-y-3 text-muted-foreground mb-8">
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>All current & future agents</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Lifetime updates</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Premium support</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fas fa-check text-green-500"></i>
                <span>Fair use policy applies</span>
              </li>
            </ul>
            <a 
              href="https://tally.so/r/3yVLrp"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              data-testid="button-lifetime"
            >
              Join Waitlist for Nov Launch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
