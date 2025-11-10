export default function Footer() {
  const handleLegalClick = (type: string) => {
    // Placeholder for legal page navigation
    console.log(`Navigate to ${type} page`);
  };

  return (
    <footer id="contact" className="bg-primary text-primary-foreground py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2" data-testid="footer-branding">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <i className="fas fa-stethoscope text-primary text-sm"></i>
              </div>
              <span className="text-xl font-bold">AISTETH</span>
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              AI-powered assistants for physicians. Save time, reduce costs, and optimize billing through intelligent automation.
            </p>
            <p className="text-slate-400 text-sm">
              Visit us at <a href="https://aisteth.xyz" className="text-blue-400 hover:text-blue-300" data-testid="link-website">aisteth.xyz</a>
            </p>
          </div>
          
          <div data-testid="footer-contact">
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a 
                  href="mailto:aistethxyz@gmail.com" 
                  className="hover:text-white transition-colors flex items-center space-x-2"
                  data-testid="link-email"
                >
                  <i className="fas fa-envelope text-sm"></i>
                  <span>aistethxyz@gmail.com</span>
                </a>
              </li>
              <li className="text-slate-400 text-sm" data-testid="text-location">Ontario, Canada</li>
            </ul>
          </div>
          
          <div data-testid="footer-legal">
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <button 
                  onClick={() => handleLegalClick('terms')}
                  className="hover:text-white transition-colors text-left"
                  data-testid="link-terms"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLegalClick('privacy')}
                  className="hover:text-white transition-colors text-left"
                  data-testid="link-privacy"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400" data-testid="footer-copyright">
          <p>&copy; 2025 AISTETH. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
