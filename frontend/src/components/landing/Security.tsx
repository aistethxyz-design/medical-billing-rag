export default function Security() {
  return (
    <>
      {/* Security Section */}
      <section className="py-12 lg:py-16 bg-secondary" data-testid="security-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6" data-testid="security-headline">
              Enterprise-Grade Security & Privacy
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed" data-testid="security-description">
              Your data security is our top priority. Complete privacy and compliance with healthcare regulations through isolated infrastructure and strict data protection.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-12 lg:py-16 bg-background" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6" data-testid="testimonials-headline">
              Testimonials
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border" data-testid="testimonial-kwasi">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-user-md text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">█████ ███████</h3>
                  <p className="text-sm text-muted-foreground">Emergency Medicine Resident</p>
                  <p className="text-sm text-muted-foreground">Toronto</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed italic">
                "Having instant access to protocols through the shift agent has made my practice more efficient so I can focus on other aspects of being a good physician."
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border" data-testid="testimonial-ben">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-user-md text-green-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">███ ███████</h3>
                  <p className="text-sm text-muted-foreground">Emergency Medicine</p>
                  <p className="text-sm text-muted-foreground">Mississauga</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed italic">
                "The admin agent handles my scheduling seamlessly. I can focus on patient care while AISTETH manages the administrative burden."
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border" data-testid="testimonial-caleb">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <i className="fas fa-user-md text-purple-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">█████ ██████</h3>
                  <p className="text-sm text-muted-foreground">Family Medicine</p>
                  <p className="text-sm text-muted-foreground">Orangeville</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed italic">
                "AISTETH has completely transformed how I handle billing during my shifts. The AI recommendations save me hours of paperwork every week."
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
