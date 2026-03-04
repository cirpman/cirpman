import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Home, Users, Building, Calendar, BarChart3, Images, Clock, FileText, MessageSquare, HelpCircle, Star, Mail, DollarSign, Menu, UserCog, ClipboardList } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // This will now primarily control mobile sheet
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'properties', label: 'Properties', icon: Building },
    { id: 'site-visits', label: 'Site Visits', icon: Calendar },
    { id: 'visitor-log', label: 'Visitor Log', icon: ClipboardList },
    { id: 'subscriptions', label: 'Subscriptions', icon: FileText },
    { id: 'gallery', label: 'Gallery', icon: Images },
    { id: 'progress', label: 'Progress', icon: Clock },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'testimonials', label: 'Testimonials', icon: Star },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'newsletter', label: 'Newsletter', icon: Mail },
    { id: 'payment-links', label: 'Payment Links', icon: DollarSign },
    { id: 'users', label: 'User Management', icon: UserCog },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for larger screens */}
      <aside
        className={cn(
          "hidden md:flex flex-col w-20 hover:w-64 bg-brand-blue text-white shadow-lg transition-all duration-300 ease-in-out group",
          isHovered ? "w-64" : "w-20"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-4 text-center border-b border-brand-blue-dark">
          <h2 className={cn("text-xl font-bold transition-opacity duration-300 group-hover:opacity-100", !isHovered && "opacity-0 hidden")}>
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto mt-4">
          <Link to="/" className={cn("w-full flex items-center text-white hover:text-brand-gold/80 transition-colors", !isHovered && "justify-center")}>
            <Home className={cn("h-5 w-5 mr-3", !isHovered && "mr-0")} />
            <span className={cn("transition-opacity duration-300 group-hover:opacity-100", !isHovered && "opacity-0 hidden")}>
              Return Home
            </span>
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left text-white hover:bg-brand-gold/20",
                  activeTab === item.id && "bg-brand-gold/30 hover:bg-brand-gold/40"
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className={cn("h-5 w-5 mr-3", !isHovered && "mr-0")} />
                <span className={cn("transition-opacity duration-300 group-hover:opacity-100", !isHovered && "opacity-0 hidden")}>
                  {item.label}
                </span>
              </Button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-brand-blue-dark">
          {/* Removed Return Home from here */}
        </div>
      </aside>

      {/* Main  content area */}
      <div className="flex-1 flex flex-col">
        {/* Header for smaller screens */}
        <header className="bg-white shadow md:hidden flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-brand-blue">Admin Dashboard</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-brand-blue text-white">
              <nav className="flex flex-col space-y-1 mt-6 h-full overflow-y-auto">
                <Link to="/" className="w-full flex items-center text-white hover:text-brand-gold/80 transition-colors mb-4">
                  <Home className="h-5 w-5 mr-3" />
                  <span>Return Home</span>
                </Link>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left text-white hover:bg-brand-gold/20",
                        activeTab === item.id && "bg-brand-gold/30 hover:bg-brand-gold/40"
                      )}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false); // Close sheet on item click
                      }}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      <span>{item.label}</span>
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;