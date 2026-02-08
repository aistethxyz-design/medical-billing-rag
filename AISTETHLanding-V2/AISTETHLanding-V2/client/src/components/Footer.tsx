const Footer = () => {
  return (
    <footer id="footer" className="bg-slate-900 text-white py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold mb-6 tracking-tight">WiserDoc</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Empowering businesses with document-enhanced AI. Control your intelligence with private, secure, and accurate RAG technology.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Solutions</h4>
            <ul className="space-y-4 text-slate-300">
              <li><a href="#healthcare" className="hover:text-primary transition">Healthcare (AISTETH)</a></li>
              <li><a href="#customer-service" className="hover:text-primary transition">Store Front Agents</a></li>
              <li><a href="#employee-training" className="hover:text-primary transition">Employee Training</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Contact</h4>
            <ul className="space-y-4 text-slate-300">
              <li>
                <a href="mailto:aistethxyz@gmail.com" className="hover:text-primary transition block">
                  aistethxyz@gmail.com
                </a>
              </li>
              <li className="text-slate-500">Toronto, Ontario, Canada</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Legal</h4>
            <ul className="space-y-4 text-slate-300">
              <li><a href="#" className="hover:text-primary transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:row justify-between items-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} WiserDoc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
