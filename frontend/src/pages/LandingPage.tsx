import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/landing/Header';
import Hero from '@/components/landing/Hero';
import ValueProposition from '@/components/landing/ValueProposition';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Security from '@/components/landing/Security';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

const LandingPage: React.FC = () => {
  const [status, setStatus] = useState<string>('Checking System...');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(data.message || 'Online'))
      .catch(err => setStatus('Offline (API Error)'));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-slate-900 text-white text-xs py-1 px-4 text-center">
        API Status: <span className={status.includes('Error') || status.includes('Offline') ? 'text-red-400' : 'text-green-400'}>{status}</span>
      </div>
      <Header />
      <Hero />
      <ValueProposition />
      <Features />
      <Pricing />
      <Security />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
