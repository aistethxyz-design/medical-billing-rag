export default function ValueProposition() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden" data-testid="value-proposition-section">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30"></div>
      <div className="absolute top-10 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 section-divider">
          <div className="inline-block mb-6">
            <span className="badge-gradient px-6 py-3 text-lg">💰 ROI Calculator</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold mb-8" data-testid="value-headline">
            <span className="gradient-text block">Save Hundreds to</span>
            <span className="text-gray-900">Thousands of Dollars</span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed" data-testid="value-description">
            Reduce administrative overhead and capture missed billing opportunities through 
            <span className="font-semibold text-blue-600"> seamless AI integration</span> with your existing workflow.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          <div className="feature-card text-center group" data-testid="value-time-savings">
            <div className="w-20 h-20 icon-container-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-clock text-green-600 text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold mb-4 gradient-text">Time Savings</h3>
            <p className="text-gray-600 leading-relaxed mb-4">Reduce administrative tasks by up to 3-4 hours per day with intelligent automation.</p>
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <div className="text-3xl font-bold text-green-600 mb-1">3-4</div>
              <div className="text-sm text-green-700 font-medium">Hours Saved Daily</div>
            </div>
          </div>
          
          <div className="feature-card text-center group" data-testid="value-cost-reduction">
            <div className="w-20 h-20 icon-container-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-dollar-sign text-blue-600 text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold mb-4 gradient-text">Cost Reduction</h3>
            <p className="text-gray-600 leading-relaxed mb-4">Lower overhead costs through streamlined operations and reduced manual work.</p>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="text-3xl font-bold text-blue-600 mb-1">40%</div>
              <div className="text-sm text-blue-700 font-medium">Admin Cost Reduction</div>
            </div>
          </div>
          
          <div className="feature-card text-center group" data-testid="value-revenue-optimization">
            <div className="w-20 h-20 icon-container-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-chart-line text-purple-600 text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold mb-4 gradient-text">Revenue Optimization</h3>
            <p className="text-gray-600 leading-relaxed mb-4">Capture missed billing opportunities and optimize OHIP code selection.</p>
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <div className="text-3xl font-bold text-purple-600 mb-1">$15K+</div>
              <div className="text-sm text-purple-700 font-medium">Monthly Revenue Boost</div>
            </div>
          </div>
        </div>
        
        {/* ROI Calculator Section */}
        <div className="mt-20">
          <div className="glass-card rounded-3xl p-8 lg:p-12 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                <span className="gradient-text">Quick ROI Calculator</span>
              </h3>
              <p className="text-gray-600">See your potential savings in the first month</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100">
                  <span className="font-medium text-gray-700">Time saved per day</span>
                  <span className="text-2xl font-bold text-green-600">3.5 hours</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100">
                  <span className="font-medium text-gray-700">Hourly rate saved</span>
                  <span className="text-2xl font-bold text-blue-600">$75/hour</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100">
                  <span className="font-medium text-gray-700">Monthly billing optimization</span>
                  <span className="text-2xl font-bold text-purple-600">$8,500</span>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="text-sm font-medium mb-2">Total Monthly Savings</div>
                  <div className="text-5xl font-bold mb-2">$24,125</div>
                  <div className="text-green-100">vs. $97/month subscription</div>
                  <div className="mt-4 text-2xl font-bold">
                    ROI: <span className="text-yellow-300">248x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
