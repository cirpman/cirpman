import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, Check, Clock, AlertCircle } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';

interface InstallmentPlan {
  id: string;
  total_amount: number;
  total_paid: number;
  next_payment_date: string;
  next_payment_amount: number;
  status: string;
  property_bookings: {
    properties: {
      title: string;
      location: string;
    };
  };
  payment_history: {
    id: string;
    amount: number;
    payment_date: string;
    notes: string;
  }[];
}

const InstallmentPayments = () => {
  const { user } = useAuth();
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInstallmentPlans();
    }
  }, [user]);

  const fetchInstallmentPlans = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/installment-plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch installment plans');
      const data = await response.json();
      setInstallmentPlans(data.plans || data || []);
    } catch (error: any) {
      toast.error('Failed to fetch installment plans: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const makePayment = async (installmentPlanId: string, amount: number) => {
    if (!user) return;

    setPaymentProcessing(installmentPlanId);
    try {
      const response = await fetch(`/api/installment-plans/${installmentPlanId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          amount: amount,
          payment_date: new Date().toISOString().split('T')[0],
          notes: 'Manual payment via dashboard'
        })
      });

      if (!response.ok) throw new Error('Failed to process payment');

      toast.success('Payment processed successfully!');
      fetchInstallmentPlans(); // Refresh data
    } catch (error: any) {
      toast.error('Payment failed: ' + error.message);
    } finally {
      setPaymentProcessing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid in Full':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'On Track':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'Behind':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid in Full':
        return 'bg-green-100 text-green-800';
      case 'On Track':
        return 'bg-blue-100 text-blue-800';
      case 'Behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-blue">Installment Payments</h2>
        <p className="text-gray-600">Manage your property payment plans and payment history</p>
      </div>

      {installmentPlans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Payment Plans</h3>
            <p className="text-gray-500">Book a property to start your installment plan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {installmentPlans.map((plan) => {
            const progress = (plan.total_paid / plan.total_amount) * 100;
            const isCompleted = plan.status === 'Paid in Full';
            const daysUntilPayment = plan.next_payment_date 
              ? Math.ceil((new Date(plan.next_payment_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
              : null;

            return (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-brand-blue">
                        {plan.property_bookings.properties.title}
                      </CardTitle>
                      <p className="text-gray-600">{plan.property_bookings.properties.location}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(plan.status)}
                      <Badge className={getStatusColor(plan.status)}>
                        {plan.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Payment Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Payment Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-brand-gold h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₦{plan.total_paid.toLocaleString()} paid</span>
                      <span>₦{plan.total_amount.toLocaleString()} total</span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <CreditCard className="h-4 w-4 mr-2 text-brand-blue" />
                        <span className="font-medium">Remaining Balance</span>
                      </div>
                      <p className="text-2xl font-bold text-brand-blue">
                        ₦{(plan.total_amount - plan.total_paid).toLocaleString()}
                      </p>
                    </div>

                    {!isCompleted && plan.next_payment_date && (
                      <>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Calendar className="h-4 w-4 mr-2 text-brand-blue" />
                            <span className="font-medium">Next Payment</span>
                          </div>
                          <p className="text-2xl font-bold text-brand-gold">
                            ₦{plan.next_payment_amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Due: {new Date(plan.next_payment_date).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Clock className="h-4 w-4 mr-2 text-brand-blue" />
                            <span className="font-medium">Days Until Due</span>
                          </div>
                          <p className={`text-2xl font-bold ${daysUntilPayment && daysUntilPayment < 7 ? 'text-red-600' : 'text-green-600'}`}>
                            {daysUntilPayment !== null ? `${daysUntilPayment} days` : 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Action */}
                  {!isCompleted && plan.next_payment_amount && (
                    <div className="border-t pt-4">
                      <Button
                        onClick={() => makePayment(plan.id, plan.next_payment_amount)}
                        disabled={paymentProcessing === plan.id}
                        className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
                      >
                        {paymentProcessing === plan.id ? (
                          'Processing Payment...'
                        ) : (
                          `Make Payment (₦${plan.next_payment_amount.toLocaleString()})`
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        * This is a demo payment system
                      </p>
                    </div>
                  )}

                  {/* Payment History */}
                  {plan.payment_history && plan.payment_history.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-brand-blue mb-3">Payment History</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {plan.payment_history
                          .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                          .map((payment) => (
                            <div key={payment.id} className="flex justify-between items-center text-sm py-2 px-3 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">₦{payment.amount.toLocaleString()}</span>
                                {payment.notes && (
                                  <span className="text-gray-500 ml-2">- {payment.notes}</span>
                                )}
                              </div>
                              <span className="text-gray-600">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstallmentPayments;