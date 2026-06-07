import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin } from 'lucide-react';
import { toast } from "sonner";
import { worker } from '../lib/worker';
import { useAuth } from '../hooks/useAuth';

const BookSiteVisit = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferred_date: '',
    preferred_time: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const bookingData = { ...formData, userId: user ? user.uid : null };
      const response = await worker.post('/create-site-visit-booking', bookingData);
      
      if (response.status !== 200) {
        throw new Error('Failed to submit booking');
      }

      toast.success('Site visit request submitted successfully! We will contact you soon.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        preferred_date: '',
        preferred_time: '',
        message: ''
      });
    } catch (error: any) {
      toast.error('Failed to submit request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20 bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Book a Site Visit
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Schedule a personalized tour of our properties
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Information */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Why Visit Our Properties?</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-brand-gold mt-1" />
                <div>
                  <h3 className="font-semibold">Location Assessment</h3>
                  <p className="text-gray-600">Experience the neighborhood and assess the location firsthand</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Calendar className="h-6 w-6 text-brand-gold mt-1" />
                <div>
                  <h3 className="font-semibold">Flexible Scheduling</h3>
                  <p className="text-gray-600">Choose a time that works best for your schedule</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Clock className="h-6 w-6 text-brand-gold mt-1" />
                <div>
                  <h3 className="font-semibold">Expert Guidance</h3>
                  <p className="text-gray-600">Get detailed information from our property experts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Your Visit</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    name="name"
                    placeholder="Your Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="Your Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    name="preferred_date"
                    type="date"
                    value={formData.preferred_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <Input
                    name="preferred_time"
                    type="time"
                    value={formData.preferred_time}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div>
                  <Textarea
                    name="message"
                    placeholder="Additional message or specific requirements"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>
                
                 <Button 
                   type="submit" 
                   className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue"
                   disabled={loading}
                 >
                   {loading ? <Skeleton className="h-5 w-32 mx-auto" /> : 'Book Site Visit'}
                 </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookSiteVisit;
