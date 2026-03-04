
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingUp, Shield, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const WhyInvest = () => {
  const benefits = [
    {
      icon: MapPin,
      title: 'Prime Location',
      description: 'Strategically located in rapidly developing areas with excellent connectivity and infrastructure.',
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'High ROI',
      description: 'Proven track record of 200-300% return on investment within 2-5 years.',
      color: 'text-green-600'
    },
    {
      icon: Shield,
      title: 'Secure Investment',
      description: 'Legal documentation, government approvals, and comprehensive insurance coverage.',
      color: 'text-brand-gold'
    },
    {
      icon: Building2,
      title: 'World-Class Amenities',
      description: 'Modern infrastructure, 24/7 security, recreational facilities, and premium finishing.',
      color: 'text-purple-600'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-brand-blue mb-6">
            Why Invest with Cirpman Homes Ltd?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied investors who have secured their financial future 
            through our premium real estate developments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card 
              key={benefit.title}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg"
            >
              <CardContent className="p-8 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6 group-hover:bg-brand-gold/10 transition-colors ${benefit.color}`}>
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-brand-blue mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-brand-blue rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Investment Journey?
          </h3>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Don't miss out on this opportunity to secure premium plots in Nigeria's most promising real estate development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-site-visit">
              <button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                Schedule Site Inspection
              </button>
            </Link>
            <button className="border-2 border-white text-white hover:bg-white hover:text-brand-blue px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              Download Brochure
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyInvest;
