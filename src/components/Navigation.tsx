
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Phone, ChevronDown, User, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Properties', path: '/properties' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const moreItems = [
    { name: 'Progress', path: '/progress' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Blog', path: '/blog' },
    { name: 'Testimonials', path: '/testimonials' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Feedback', path: '/feedback' },
    { name: 'Start an Installment', path: '/customer-subscription' },
    { name: 'Become a Consultant', path: '/consultant-subscription' }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = () => {
    signOut();
    setIsDashboardOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    return profile?.role === 'admin' ? '/admin' : '/dashboard/client';
  };

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/Cripman homes ltd. Logo.png" 
              alt="Cirpman Homes Ltd Logo" 
              className="h-12 w-auto"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-brand-blue">Cirpman Homes Ltd</h1>
              <p className="text-xs text-gray-600">Premium Real Estate</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium transition-colors duration-200 hover:text-brand-gold ${
                  isActive(item.path) ? 'text-brand-gold' : 'text-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* More dropdown for desktop */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 hover:text-brand-gold transition-colors"
              >
                <span>More</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isMoreOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                  {moreItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMoreOpen(false)}
                      className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        isActive(item.path) ? 'text-brand-gold font-medium' : 'text-gray-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="hidden lg:flex items-center space-x-4">
            <a 
              href="tel:+2349132541977" 
              className="flex items-center space-x-2 text-brand-blue hover:text-brand-gold transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="text-sm font-medium">+234 913 254 1977</span>
            </a>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                  className="flex items-center space-x-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isDashboardOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setIsDashboardOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      My Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/book-site-visit"
                  className="text-sm font-medium text-brand-blue hover:text-brand-gold transition-colors"
                >
                  Book Site Visit
                </Link>
                <Link
                  to="/auth"
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  Login/Signup
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="text-brand-blue hover:text-brand-gold">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col space-y-6 mt-8 h-full overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-medium transition-colors ${
                      isActive(item.path) ? 'text-brand-gold' : 'text-gray-700 hover:text-brand-blue'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {moreItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-medium transition-colors ${
                      isActive(item.path) ? 'text-brand-gold' : 'text-gray-700 hover:text-brand-blue'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                <div className="pt-6 border-t">
                  <a 
                    href="tel:+2349132541977" 
                    className="flex items-center space-x-2 text-brand-blue mb-4 hover:text-brand-gold transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span>+234 913 254 1977</span>
                  </a>
                  
                  {user ? (
                    <div className="space-y-3">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setIsOpen(false)}
                        className="block w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-semibold py-2 px-4 rounded-md text-center transition-colors"
                      >
                        My Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/book-site-visit"
                        onClick={() => setIsOpen(false)}
                        className="block text-center text-brand-blue hover:text-brand-gold font-medium transition-colors"
                      >
                        Book Site Visit
                      </Link>
                      <Link
                        to="/auth"
                        onClick={() => setIsOpen(false)}
                        className="block w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-semibold py-2 px-4 rounded-md text-center transition-colors"
                      >
                        Login/Signup
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
