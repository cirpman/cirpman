import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, UserCog } from 'lucide-react';
import { toast } from "sonner";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { worker } from '@/lib/worker';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  role: string;
}

const ClientsManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientPlans, setClientPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await worker.post('/get-profiles', {});
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const clientsData = await response.json();
      setClients(clientsData || []);
    } catch (error: any) {
      toast.error('Failed to fetch clients: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'client') => {
    try {
      await worker.post('/update-user-role', { userId, newRole });
      setClients(prev => prev.map(client => 
        client.id === userId ? { ...client, role: newRole } : client
      ));
      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      toast.error('Failed to update user role: ' + error.message);
    }
  };

  const fetchClientPlans = async (clientId: string) => {
    setPlansLoading(true);
    // TODO: Backend endpoint for getClientPlans is not implemented yet.
    toast.info('This feature is temporarily disabled.');
    setClientPlans([]);
    setPlansLoading(false);
    // try {
    //   const response = await worker.post('/get-client-plans', { clientId });
    //   if (!response.ok) {
    //     throw new Error('Failed to fetch client plans');
    //   }
    //   const data = await response.json();
    //   setClientPlans(data || []);
    // } catch (e) {
    //   setClientPlans([]);
    // } finally {
    //   setPlansLoading(false);
    // }
  };

  const handleOpenClientPlans = (client: any) => {
    setSelectedClient(client);
    fetchClientPlans(client.id);
  };

  const handleUpdateStage = async (planId: string, newStatus: string) => {
    // TODO: Backend endpoint for updateInstallmentStage is not implemented yet.
    toast.info('This feature is temporarily disabled.');
    // try {
    //     await worker.post('/update-installment-stage', { planId, newStatus });
    //     setClientPlans(plans => plans.map(plan => ({
    //         ...plan,
    //         installment_plans: plan.installment_plans.map((ip: any) => ip.id === planId ? { ...ip, status: newStatus } : ip)
    //       })));
    //     toast.success('Installment stage updated!');
    // } catch (error) {
    //     toast.error('Failed to update stage');
    // }
  };

  const filteredClients = clients.filter(client =>
    (client.full_name && client.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Clients Management</span>
          </CardTitle>
          <CardDescription>
            View and manage all registered clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Clients Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Phone</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Signup Date</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{client.full_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">Profile-based</td>
                    <td className="py-3 px-4">{client.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {client.role || 'client'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Select
                          value={client.role}
                          onValueChange={(newRole: 'admin' | 'client') => updateUserRole(client.id, newRole)}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <UserCog className="h-4 w-4 text-gray-400" />
                        <Button size="sm" variant="outline" onClick={() => handleOpenClientPlans(client)}>
                          View Installments
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No clients have registered yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Installment Modal */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-2xl w-full">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Installment Plans for {selectedClient.full_name}</h2>
            </div>
            {plansLoading ? (
              <div>Loading...</div>
            ) : clientPlans.length === 0 ? (
              <div>No installment plans found for this client.</div>
            ) : (
              <div className="space-y-4">
                {clientPlans.map((booking) => booking.installment_plans.map((plan: any) => {
                  const progress = (plan.total_paid / plan.total_amount) * 100;
                  return (
                    <div key={plan.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <div className="font-semibold">{booking.properties?.title || 'Property'}</div>
                          <div className="text-xs text-gray-500">Booking: {booking.id}</div>
                        </div>
                        <Select value={plan.status} onValueChange={val => handleUpdateStage(plan.id, val)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On Track">On Track</SelectItem>
                            <SelectItem value="Paid in Full">Paid in Full</SelectItem>
                            <SelectItem value="Behind">Behind</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mb-2">Total: ₦{plan.total_amount.toLocaleString()} | Paid: ₦{plan.total_paid.toLocaleString()}</div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">Status: {plan.status}</div>
                    </div>
                  );
                }))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientsManagement;
