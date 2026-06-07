import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Calendar, CreditCard } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import PropertySelection from './PropertySelection';

interface Booking {
  id: string;
  total_price: number;
  created_at: string;
  properties: {
    title: string;
    location: string;
    status: string;
  };
  installment_plans: {
    total_amount: number;
    total_paid: number;
    status: string;
    next_payment_date: string;
    next_payment_amount: number;
  }[];
}

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertySelection, setShowPropertySelection] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.bookings || data || []);
    } catch (error: any) {
      toast.error('Failed to fetch bookings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  if (showPropertySelection) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowPropertySelection(false)}
            className="mb-4"
          >
            ← Back to My Bookings
          </Button>
        </div>
        <PropertySelection />
      </div>
    );
  }

  const ACCOUNT_NUMBER = '1234567890'; // Replace with real account number
  const paidBookings = bookings.filter(b => b.installment_plans[0]?.status === 'Paid in Full');
  const unpaidBookings = bookings.filter(b => b.installment_plans[0]?.status !== 'Paid in Full');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-blue">My Property Bookings</h2>
          <p className="text-gray-600">Track your property investments and payment progress</p>
        </div>
        <Button
          onClick={() => setShowPropertySelection(true)}
          className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue"
        >
          Book New Property
        </Button>
      </div>
      {/* Unpaid Bookings */}
      <div>
        <h3 className="text-xl font-semibold text-red-600 mb-2">Unpaid / Ongoing Bookings</h3>
        {unpaidBookings.length === 0 ? (
          <div className="text-gray-500">No unpaid or ongoing bookings.</div>
        ) : (
          <div className="grid gap-6">
            {unpaidBookings.map((booking) => {
              const installmentPlan = booking.installment_plans[0];
              const progress = installmentPlan ? (installmentPlan.total_paid / installmentPlan.total_amount) * 100 : 0;
              return (
                <Card key={booking.id} className="overflow-hidden border-red-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-brand-blue flex items-center">
                          <Building className="h-5 w-5 mr-2" />
                          {booking.properties.title}
                        </CardTitle>
                        <p className="text-gray-600">{booking.properties.location}</p>
                      </div>
                      <Badge variant={booking.properties.status === 'Available' ? 'default' : 'secondary'}>
                        {booking.properties.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <CreditCard className="h-4 w-4 mr-2 text-brand-blue" />
                          <span className="font-medium">Total Investment</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-gold">
                          ₦{booking.total_price.toLocaleString()}
                        </p>
                      </div>
                      {installmentPlan && (
                        <>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              <Calendar className="h-4 w-4 mr-2 text-brand-blue" />
                              <span className="font-medium">Payment Progress</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">
                              {progress.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              ₦{installmentPlan.total_paid.toLocaleString()} of ₦{installmentPlan.total_amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              <CreditCard className="h-4 w-4 mr-2 text-brand-blue" />
                              <span className="font-medium">Next Payment</span>
                            </div>
                            <p className="text-2xl font-bold text-brand-blue">
                              ₦{installmentPlan.next_payment_amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Due: {new Date(installmentPlan.next_payment_date).toLocaleDateString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {installmentPlan && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Payment Status:</span>
                          <Badge variant={installmentPlan.status === 'On Track' ? 'default' : 'destructive'}>
                            {installmentPlan.status}
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-brand-gold h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Booked on: {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                    {/* Account number and notify admin button */}
                    <div className="mt-4 p-3 bg-yellow-50 border rounded">
                      <div className="mb-2">Please make your payment to:</div>
                      <div className="font-bold text-lg mb-1">Account Number: <span className="text-brand-blue">{ACCOUNT_NUMBER}</span></div>
                      <Button
                        className="bg-brand-blue text-white mt-2"
                        onClick={() => toast.success('Admin has been notified of your payment!')}
                      >
                        Notify Admin of Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {/* Paid Bookings */}
      <div>
        <h3 className="text-xl font-semibold text-green-700 mb-2 mt-8">Paid Bookings</h3>
        {paidBookings.length === 0 ? (
          <div className="text-gray-500">No fully paid bookings yet.</div>
        ) : (
          <div className="grid gap-6">
            {paidBookings.map((booking) => {
              const installmentPlan = booking.installment_plans[0];
              const progress = installmentPlan ? (installmentPlan.total_paid / installmentPlan.total_amount) * 100 : 0;
              return (
                <Card key={booking.id} className="overflow-hidden border-green-300">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-brand-blue flex items-center">
                          <Building className="h-5 w-5 mr-2" />
                          {booking.properties.title}
                        </CardTitle>
                        <p className="text-gray-600">{booking.properties.location}</p>
                      </div>
                      <Badge variant={booking.properties.status === 'Available' ? 'default' : 'secondary'}>
                        {booking.properties.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <CreditCard className="h-4 w-4 mr-2 text-brand-blue" />
                          <span className="font-medium">Total Investment</span>
                        </div>
                        <p className="text-2xl font-bold text-brand-gold">
                          ₦{booking.total_price.toLocaleString()}
                        </p>
                      </div>
                      {installmentPlan && (
                        <>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              <Calendar className="h-4 w-4 mr-2 text-brand-blue" />
                              <span className="font-medium">Payment Progress</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">
                              {progress.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              ₦{installmentPlan.total_paid.toLocaleString()} of ₦{installmentPlan.total_amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                              <CreditCard className="h-4 w-4 mr-2 text-brand-blue" />
                              <span className="font-medium">Status</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700">
                              Paid in Full
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Booked on: {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;