import React, { useEffect } from 'react';
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
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.email === 'demo@aisteth.com') {
        navigate('/RAG/000000vnox38');
      } else {
        navigate('/billing');
      }
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <div className="min-h-screen bg-background">
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
