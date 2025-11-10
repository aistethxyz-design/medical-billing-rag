export default function ValueProposition() {
  return (
    <section className="py-12 lg:py-16 bg-secondary" data-testid="value-proposition-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6" data-testid="value-headline">
            Save Hundreds to Thousands of Dollars
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed" data-testid="value-description">
            Reduce administrative overhead and capture missed billing opportunities through seamless integration with devices and tools you already use.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center" data-testid="value-time-savings">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clock text-green-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Time Savings</h3>
            <p className="text-muted-foreground">Reduce administrative tasks by up to 3-4 hours per day with intelligent automation.</p>
          </div>
          
          <div className="text-center" data-testid="value-cost-reduction">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-dollar-sign text-blue-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Cost Reduction</h3>
            <p className="text-muted-foreground">Lower overhead costs through streamlined operations and reduced manual work.</p>
          </div>
          
          <div className="text-center" data-testid="value-revenue-optimization">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-chart-line text-purple-600 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Revenue Optimization</h3>
            <p className="text-muted-foreground">Capture missed billing opportunities and optimize OHIP code selection.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
