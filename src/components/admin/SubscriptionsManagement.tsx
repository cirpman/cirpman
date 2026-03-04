import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Download, Eye, Mail, Filter, Users, UserCheck } from 'lucide-react';
import { generateCustomerSubscriptionPDF, generateConsultantSubscriptionPDF, downloadPDF } from '@/lib/pdfGenerator';
import { worker } from '@/lib/worker';

interface CustomerSubscription {
  id: string;
  surname: string;
  firstName: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  selectedPackages: string[];
  paymentPlan: string;
  installment_preview?: {
    monthlyPayment: number;
    totalAmount: number;
    firstDeposit: number;
  };
}

interface ConsultantSubscription {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  occupation: string;
  bankName: string;
}

const SubscriptionsManagement = () => {
  const [customerSubscriptions, setCustomerSubscriptions] = useState<CustomerSubscription[]>([]);
  const [consultantSubscriptions, setConsultantSubscriptions] = useState<ConsultantSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const [customerResponse, consultantResponse] = await Promise.all([
        worker.post('/get-customer-subscriptions', {}),
        worker.post('/get-consultant-subscriptions', {}),
      ]);

      if (!customerResponse.ok || !consultantResponse.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const customerData = await customerResponse.json();
      const consultantData = await consultantResponse.json();

      setCustomerSubscriptions(Array.isArray(customerData) ? customerData : []);
      setConsultantSubscriptions(Array.isArray(consultantData) ? consultantData : []);
    } catch (error: any) {
      toast.error('Failed to fetch subscriptions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomerSubscriptions = customerSubscriptions.filter(sub => {
    const matchesSearch = 
      sub.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredConsultantSubscriptions = consultantSubscriptions.filter(sub => {
    const matchesSearch = 
      sub.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleExportPDF = async (subscription: any, type: 'customer' | 'consultant') => {
    try {
      let pdfBytes;
      let filename;

      if (type === 'customer') {
        pdfBytes = await generateCustomerSubscriptionPDF(subscription);
        filename = `customer-subscription-${subscription.surname}-${subscription.firstName}.pdf`;
      } else {
        pdfBytes = await generateConsultantSubscriptionPDF(subscription);
        filename = `consultant-application-${subscription.firstName}-${subscription.lastName}.pdf`;
      }

      downloadPDF(pdfBytes, filename);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handleBulkExport = async (type: 'customer' | 'consultant') => {
    const subscriptions = type === 'customer' ? filteredCustomerSubscriptions : filteredConsultantSubscriptions;
    
    if (subscriptions.length === 0) {
      toast.error('No subscriptions to export');
      return;
    }

    try {
      for (const subscription of subscriptions) {
        await handleExportPDF(subscription, type);
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      toast.success(`Exported ${subscriptions.length} PDFs successfully!`);
    } catch (error) {
      toast.error('Bulk export failed');
    }
  };

  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Subscriptions Management</span>
          </CardTitle>
          <CardDescription>
            Manage customer subscriptions and consultant applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status-filter">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="customers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customers" className="flex items-center space-x-2">
                <UserCheck className="h-4 w-4" />
                <span>Customer Subscriptions ({filteredCustomerSubscriptions.length})</span>
              </TabsTrigger>
              <TabsTrigger value="consultants" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Consultant Applications ({filteredConsultantSubscriptions.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Customer Subscriptions</h3>
                <Button
                  onClick={() => handleBulkExport('customer')}
                  disabled={filteredCustomerSubscriptions.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All PDFs
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredCustomerSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-semibold">
                              {subscription.surname} {subscription.firstName}
                            </h4>
                            <p className="text-sm text-gray-600">{subscription.email}</p>
                            <p className="text-sm text-gray-600">{subscription.phone}</p>
                          </div>
                          <div className="flex flex-col space-y-1">
                            {getStatusBadge(subscription.status)}
                            <p className="text-xs text-gray-500">
                              {new Date(subscription.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Payment Plan:</span> {subscription.paymentPlan} | 
                          <span className="font-medium ml-2">Packages:</span> {subscription.selectedPackages.length}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSubscription(subscription)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPDF(subscription, 'customer')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="consultants" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Consultant Applications</h3>
                <Button
                  onClick={() => handleBulkExport('consultant')}
                  disabled={filteredConsultantSubscriptions.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All PDFs
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredConsultantSubscriptions.map((subscription) => (
                  <Card key={subscription.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-semibold">
                              {subscription.firstName} {subscription.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">{subscription.email}</p>
                            <p className="text-sm text-gray-600">{subscription.phone}</p>
                          </div>
                          <div className="flex flex-col space-y-1">
                            {getStatusBadge(subscription.status)}
                            <p className="text-xs text-gray-500">
                              {new Date(subscription.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Occupation:</span> {subscription.occupation} | 
                          <span className="font-medium ml-2">Bank:</span> {subscription.bankName}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSubscription(subscription)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPDF(subscription, 'consultant')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Subscription Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              View complete subscription information
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedSubscription).map(([key, value]) => {
                    if (typeof value === 'string' && !key.includes('_') && key !== 'id' && key !== 'status' && key !== 'created_at') {
                      return (
                        <div key={key}>
                          <Label className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </Label>
                          <p className="text-sm text-gray-600">{String(value)}</p>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const type = 'selectedPackages' in selectedSubscription ? 'customer' : 'consultant';
                    handleExportPDF(selectedSubscription, type);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsManagement;
