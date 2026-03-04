
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, Calendar, BarChart3 } from 'lucide-react';
import ClientsManagement from '@/components/admin/ClientsManagement';
import PropertiesManagement from '@/components/admin/PropertiesManagement';
import SiteVisitsManagement from '@/components/admin/SiteVisitsManagement';
import GalleryManagement from '@/components/admin/GalleryManagement';
import ProgressTimelineManagement from '@/components/admin/ProgressTimelineManagement';
import SubscriptionsManagement from '@/components/admin/SubscriptionsManagement';
import BlogManagement from '@/components/admin/BlogManagement';
import TestimonialsManagement from '@/components/admin/TestimonialsManagement';
import FAQManagement from '@/components/admin/FAQManagement';
import FeedbackManagement from '@/components/admin/FeedbackManagement';
import NewsletterManagement from '@/components/admin/NewsletterManagement';
import PaymentLinkManagement from '@/components/admin/PaymentLinkManagement';
import AdminLayout from '@/components/admin/AdminLayout';
import UsersPage from '@/pages/UsersPage';
import VisitorLogPage from '@/pages/VisitorLog';
import { worker } from '@/lib/worker';

const AdminDashboard = () => {
  const { user, loading } = useAuth(true, 'admin');
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState({
    clients: 0,
    properties: 0,
    siteVisits: 0,
    revenue: 0,
    subscriptions: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchOverview = async () => {
    setOverviewLoading(true);
    try {
      const response = await worker.post('/admin/stats', {});
      if (response.ok) {
        const data = await response.json();
        setOverview({
          clients: data.clients || 0,
          properties: data.properties || 0,
          siteVisits: data.siteVisits || 0,
          revenue: data.revenue || 0,
          subscriptions: data.subscriptions || 0,
        });
      } else {
        setOverview({ clients: 0, properties: 0, siteVisits: 0, revenue: 0, subscriptions: 0 });
      }
    } catch (e) {
      console.error('Error fetching overview:', e);
      setOverview({ clients: 0, properties: 0, siteVisits: 0, revenue: 0, subscriptions: 0 });
    } finally {
      setOverviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-gold"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'clients':
        return <ClientsManagement />;
      case 'properties':
        return <PropertiesManagement />;
      case 'site-visits':
        return <SiteVisitsManagement />;
      case 'visitor-log':
        return <VisitorLogPage />;
      case 'subscriptions':
        return <SubscriptionsManagement />;
      case 'gallery':
        return <GalleryManagement />;
      case 'progress':
        return <ProgressTimelineManagement />;
      case 'blog':
        return <BlogManagement />;
      case 'testimonials':
        return <TestimonialsManagement />;
      case 'faq':
        return <FAQManagement />;
      case 'feedback':
        return <FeedbackManagement />;
      case 'newsletter':
        return <NewsletterManagement />;
      case 'payment-links':
        return <PaymentLinkManagement />;
      case 'users': 
        return <UsersPage />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewLoading ? '...' : overview.clients}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewLoading ? '...' : overview.properties}</div>
                <p className="text-xs text-muted-foreground">Listed properties</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Site Visit Requests</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewLoading ? '...' : overview.siteVisits}</div>
                <p className="text-xs text-muted-foreground">Pending visits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewLoading ? '...' : `₦${(overview.revenue || 0).toLocaleString()}`}</div>
                <p className="text-xs text-muted-foreground">Total earnings</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
