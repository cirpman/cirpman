
import React from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import WhyInvest from '@/components/WhyInvest';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <WhyInvest />
      <Footer />
    </div>
  );
};

export default Index;
