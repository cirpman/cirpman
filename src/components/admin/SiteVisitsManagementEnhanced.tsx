import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Search, Users, Phone, Mail } from 'lucide-react';
import { toast } from "sonner";
import { worker } from '@/lib/worker';

interface SiteVisitBooking {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  follow_up_status: string;
  created_at: string;
  user_id: string | null;
}

const SiteVisitsManagementEnhanced = () => {
  const [bookings, setBookings] = useState<SiteVisitBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await worker.post('/get-site-visit-bookings', {});
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Failed to fetch bookings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFollowUpStatus = async (bookingId: string, newStatus: string) => {
    try {
      await worker.post('/update-site-visit-status', { bookingId, newStatus });
      setBookings(prev => prev.map(booking =>
        booking.id === bookingId 
          ? { ...booking, follow_up_status: newStatus }
          : booking
      ));
      toast.success('Follow-up status updated');
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || booking.follow_up_status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Card - move to top */}
      {bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['Pending', 'Contacted', 'Scheduled', 'Completed', 'Cancelled'].map(status => {
                const count = bookings.filter(b => b.follow_up_status === status).length;
                return (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold text-brand-gold">{count}</div>
                    <div className="text-sm text-gray-600">{status}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Site Visit Bookings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Site Visit Bookings</span>
          </CardTitle>
          <CardDescription>
            Manage and track site visit requests from potential clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookings Grid */}
          {filteredBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{booking.name}</h3>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{booking.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{booking.phone}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.follow_up_status)}>
                        {booking.follow_up_status}
                      </Badge>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(booking.preferred_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{booking.preferred_time}</span>
                      </div>
                    </div>

                    {booking.message && (
                      <div className="border-t pt-3">
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {booking.message}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <Select
                        value={booking.follow_up_status}
                        onValueChange={(value) => updateFollowUpStatus(booking.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Contacted">Contacted</SelectItem>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-xs text-gray-500">
                      Requested: {new Date(booking.created_at).toLocaleString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Site Visit Bookings</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'No bookings match your search criteria.'
                  : 'No site visit requests have been received yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteVisitsManagementEnhanced;
