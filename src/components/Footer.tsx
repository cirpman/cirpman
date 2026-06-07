import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';
import NewsletterSubscription from './NewsletterSubscription';

const Footer = () => {
  return (
    <footer className="bg-brand-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/Cripman homes ltd. Logo.png" 
                alt="Cirpman Homes Ltd Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h3 className="text-xl font-bold">Cirpman Homes Ltd</h3>
                <p className="text-brand-grey-light">Premium Real Estate</p>
              </div>
            </div>
            <p className="text-brand-grey-light mb-6 max-w-md">
              To revitalize communities by connecting people with properties that inspire and enhance their lifestyles.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a 
                href="https://instagram.com/cirpmanhomes" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue p-2 rounded-full transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://facebook.com/cirpmanhomes" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue p-2 rounded-full transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-brand-grey-light hover:text-brand-gold transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/properties" className="text-brand-grey-light hover:text-brand-gold transition-colors">
                  Properties
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-brand-grey-light hover:text-brand-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-brand-grey-light hover:text-brand-gold transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/book-site-visit" className="text-brand-grey-light hover:text-brand-gold transition-colors">
                  Book Site Visit
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-brand-gold" />
                <span className="text-brand-grey-light">+234 913 254 1977</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-brand-gold" />
                <span className="text-brand-grey-light">info@cirpmanhomesltd.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-brand-gold mt-1" />
                <div className="text-brand-grey-light text-sm">
                  <p>Suite 12, OJEJE Plaza</p>
                  <p>Secretariat Road, Gwagwalada</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-12 pt-8 border-t border-brand-blue-light">
          <div className="max-w-2xl mx-auto">
            <NewsletterSubscription 
              variant="card"
              title="Stay Updated with Cirpman Homes"
              description="Subscribe to our newsletter for the latest property updates, exclusive offers, and real estate insights."
              className="bg-white/10 border-white/20"
            />
          </div>
        </div>

        {/* Office Locations */}
        <div className="mt-12 pt-8 border-t border-brand-blue-light">
          <h4 className="text-lg font-semibold mb-6 text-center">Our Office Locations</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h5 className="font-semibold mb-2">Main Office</h5>
              <p className="text-brand-grey-light text-sm">
                Suite 12, OJEJE Plaza<br />
                Secretariat Road, Gwagwalada
              </p>
            </div>
            <div className="text-center">
              <h5 className="font-semibold mb-2">Branch Office 1</h5>
              <p className="text-brand-grey-light text-sm">
                Suite B27, Zampoles Plaza<br />
                Kaduna-Lokoja Expressway, Gwagwalada
              </p>
            </div>
            <div className="text-center">
              <h5 className="font-semibold mb-2">Branch Office 2</h5>
              <p className="text-brand-grey-light text-sm">
                Suite 1, E & E, El'Rufai Corner Shop<br />
                Tunga-Maje
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-brand-blue-light text-center">
          <p className="text-brand-grey-light">
            © {new Date().getFullYear()} Cirpman Homes Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
