import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, TrendingUp } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getRecaptchaToken } from '@/lib/recaptcha';

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price_min: number;
  price_max: number;
  size_min: number;
  size_max: number;
  status: string;
  progress: string;
  images: string[];
  videos?: string[]; // Added for videos
  installment_config?: {
    duration: number;
    minDepositPercent: number;
    interestRate: number;
    pricePerSqm: number;
    minSqm: number;
    maxSqm: number;
  };
}

const PropertySelection = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingProperty, setBookingProperty] = useState<string | null>(null);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [bookingModalProperty, setBookingModalProperty] = useState<Property | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferred_date: '',
    preferred_time: '',
    message: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties?status=Available');
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data.properties || data || []);
    } catch (error: any) {
      toast.error('Failed to fetch properties: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const bookProperty = async (property: Property, selectedPrice: number) => {
    if (!user) {
      toast.error('Please sign in to book a property');
      return;
    }

    setBookingProperty(property.id);
    try {
      // Create property booking with installment plan
      const userId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email');
      
      const monthlyAmount = Math.ceil(selectedPrice / 12);
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'book_property',
          property_id: property.id,
          total_price: selectedPrice,
          monthly_amount: monthlyAmount,
          next_payment_date: nextPaymentDate.toISOString().split('T')[0]
        })
      });

      if (!response.ok) throw new Error('Failed to book property');

      toast.success('Property booked successfully! Check your dashboard for payment details.');
    } catch (error: any) {
      toast.error('Failed to book property: ' + error.message);
    } finally {
      setBookingProperty(null);
    }
  };

  const handleBookSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalProperty) return;
    setBookingLoading(true);
    try {
      const userEmail = localStorage.getItem('user_email');
      const userId = localStorage.getItem('user_id');
      const recaptchaToken = await getRecaptchaToken('site_visit_submit');
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          action: 'site_visit',
          payload: {
            user_id: userId || null,
            user_email: userEmail,
            property_id: bookingModalProperty.id,
            name: bookingForm.name,
            email: bookingForm.email,
            phone: bookingForm.phone,
            preferred_date: bookingForm.preferred_date,
            preferred_time: bookingForm.preferred_time,
            message: bookingForm.message,
          },
          recaptchaToken
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit request');
      toast.success('Site visit request submitted successfully!');
      setBookingModalProperty(null);
      setBookingForm({ name: '', email: '', phone: '', preferred_date: '', preferred_time: '', message: '' });
    } catch (error: any) {
      toast.error('Failed to submit request: ' + error.message);
    } finally {
      setBookingLoading(false);
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
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-brand-blue mb-2">Choose Your Property</h2>
        <p className="text-gray-600">Select from our available properties and start your installment plan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 bg-gradient-to-br from-brand-blue/10 to-brand-gold/10">
              {property.images && property.images.length > 0 ? (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Building className="h-16 w-16 text-brand-blue/50" />
                </div>
              )}
              <Badge className="absolute top-3 right-3 bg-brand-gold text-brand-blue">
                {property.status}
              </Badge>
            </div>

            <CardHeader>
              <CardTitle className="text-xl text-brand-blue">{property.title}</CardTitle>
              <div className="flex items-center text-gray-600 text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {property.location}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm line-clamp-3">{property.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-brand-blue">Size:</span>
                  <p>{property.size_min} - {property.size_max} sqm</p>
                </div>
                <div>
                  <span className="font-medium text-brand-blue">Progress:</span>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    <span className="text-green-600">{property.progress}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-brand-blue">Price Range:</span>
                  <span className="text-lg font-bold text-brand-gold">
                    ₦{property.price_min.toLocaleString()} - ₦{property.price_max.toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Button
                    className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white"
                    onClick={() => bookProperty(property, property.price_min)}
                    disabled={bookingProperty === property.id}
                  >
                    {bookingProperty === property.id ? 'Booking...' : `Book at ₦${property.price_min.toLocaleString()}`}
                  </Button>
                  
                  {property.price_max > property.price_min && (
                    <Button
                      variant="outline"
                      className="w-full border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-blue"
                      onClick={() => bookProperty(property, property.price_max)}
                      disabled={bookingProperty === property.id}
                    >
                      Premium at ₦{property.price_max.toLocaleString()}
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setViewingProperty(property)}
                >
                  View Details
                </Button>
                <Button
                  className="w-full bg-brand-gold text-brand-blue"
                  onClick={() => setBookingModalProperty(property)}
                >
                  Book Site Visit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Properties Available</h3>
          <p className="text-gray-500">Check back later for new property listings.</p>
        </div>
      )}

      {/* Property Details Modal */}
      {viewingProperty && (
        <Dialog open={!!viewingProperty} onOpenChange={() => setViewingProperty(null)}>
          <DialogContent className="max-w-2xl w-full">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-brand-blue">{viewingProperty.title}</h2>
              <div className="text-gray-600 text-sm mb-2">{viewingProperty.location}</div>
              <Carousel>
                <CarouselContent>
                  {viewingProperty.images && viewingProperty.images.length > 0 && viewingProperty.images.map((img, idx) => (
                    <CarouselItem key={img + idx}>
                      <img src={img} alt={`Property image ${idx + 1}`} className="w-full h-64 object-cover rounded" />
                    </CarouselItem>
                  ))}
                  {viewingProperty.videos && viewingProperty.videos.length > 0 && viewingProperty.videos.map((vid, idx) => (
                    <CarouselItem key={vid + idx}>
                      <video src={vid} controls className="w-full h-64 object-cover rounded" />
                    </CarouselItem>
                  ))}
                  {(!viewingProperty.images?.length && !viewingProperty.videos?.length) && (
                    <CarouselItem>
                      <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
                        <Building className="h-16 w-16 text-gray-400" />
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              <div className="mt-4 space-y-2">
                <div><span className="font-medium">Description:</span> {viewingProperty.description}</div>
                <div><span className="font-medium">Size:</span> {viewingProperty.size_min} - {viewingProperty.size_max} sqm</div>
                <div><span className="font-medium">Price:</span> ₦{viewingProperty.price_min.toLocaleString()} - ₦{viewingProperty.price_max.toLocaleString()}</div>
                <div><span className="font-medium">Progress:</span> {viewingProperty.progress}</div>
                <div><span className="font-medium">Status:</span> {viewingProperty.status}</div>
              </div>
              {/* Installment Breakdown */}
              {viewingProperty.installment_config && (
                <div className="mt-6 p-4 bg-blue-50 border rounded">
                  <div className="font-semibold mb-2 text-brand-blue">Installment Payment Breakdown</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Duration: <span className="font-bold">{viewingProperty.installment_config.duration} months</span></div>
                    <div>Min Deposit: <span className="font-bold">{viewingProperty.installment_config.minDepositPercent}%</span></div>
                    <div>Interest Rate: <span className="font-bold">{viewingProperty.installment_config.interestRate}%/mo</span></div>
                    <div>Price per sqm: <span className="font-bold">₦{viewingProperty.installment_config.pricePerSqm.toLocaleString()}</span></div>
                    <div>Min Sqm: <span className="font-bold">{viewingProperty.installment_config.minSqm}</span></div>
                    <div>Max Sqm: <span className="font-bold">{viewingProperty.installment_config.maxSqm}</span></div>
                  </div>
                  {/* Calculation preview (use min sqm for preview) */}
                  {(() => {
                    const cfg = viewingProperty.installment_config;
                    const sqm = Number(cfg.minSqm);
                    const price = Number(cfg.pricePerSqm) * sqm;
                    const deposit = (Number(cfg.minDepositPercent) / 100) * price;
                    const principal = price - deposit;
                    const months = Number(cfg.duration);
                    const monthlyInterest = Number(cfg.interestRate) / 100;
                    const monthly = (principal * (1 + monthlyInterest * months)) / months;
                    const total = deposit + monthly * months;
                    return (
                      <div className="mt-3 p-3 bg-white border rounded">
                        <div>First Deposit: <span className="font-bold">₦{deposit.toLocaleString()}</span></div>
                        <div>Monthly Payment: <span className="font-bold">₦{monthly.toLocaleString()}</span></div>
                        <div>Total (Deposit + Installments): <span className="font-bold">₦{total.toLocaleString()}</span></div>
                        <div className="text-xs text-gray-500 mt-1">* Based on minimum sqm and price per sqm</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Book Site Visit Modal */}
      {bookingModalProperty && (
        <Dialog open={!!bookingModalProperty} onOpenChange={() => setBookingModalProperty(null)}>
          <DialogContent className="max-w-lg w-full">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-brand-blue mb-2">Book Site Visit for {bookingModalProperty.title}</h2>
              <form onSubmit={handleBookSiteVisit} className="space-y-3">
                <Input
                  name="name"
                  placeholder="Your Full Name"
                  value={bookingForm.name}
                  onChange={e => setBookingForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Your Email"
                  value={bookingForm.email}
                  onChange={e => setBookingForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="Your Phone Number"
                  value={bookingForm.phone}
                  onChange={e => setBookingForm(f => ({ ...f, phone: e.target.value }))}
                  required
                />
                <Input
                  name="preferred_date"
                  type="date"
                  value={bookingForm.preferred_date}
                  onChange={e => setBookingForm(f => ({ ...f, preferred_date: e.target.value }))}
                  required
                />
                <Input
                  name="preferred_time"
                  type="time"
                  value={bookingForm.preferred_time}
                  onChange={e => setBookingForm(f => ({ ...f, preferred_time: e.target.value }))}
                  required
                />
                <Textarea
                  name="message"
                  placeholder="Additional message or requirements"
                  value={bookingForm.message}
                  onChange={e => setBookingForm(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                />
                <Button
                  type="submit"
                  className="w-full bg-brand-gold text-brand-blue"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Booking...' : 'Book Site Visit'}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PropertySelection;