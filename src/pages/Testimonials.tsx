import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
// Using text-based icons
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface Testimonial {
  id: string;
  client_name: string;
  client_title: string;
  client_company: string;
  testimonial_text: string;
  rating: number;
  featured: boolean;
  status: string;
  client_photo_url: string;
  created_at: string;
  property: {
    title: string;
    location: string;
  };
}

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');

  useEffect(() => {
    fetchTestimonials();
  }, []);


  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/testimonials');
      if (!res.ok) throw new Error('Failed to fetch testimonials');
      const data = await res.json();
      setTestimonials(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch testimonials: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = 
      testimonial.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.testimonial_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.client_company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === 'all' || testimonial.rating === parseInt(ratingFilter);
    const matchesFeatured = featuredFilter === 'all' || 
      (featuredFilter === 'featured' && testimonial.featured) ||
      (featuredFilter === 'regular' && !testimonial.featured);

    return matchesSearch && matchesRating && matchesFeatured;
  });

// Using generic icons - we'll render stars with emoji instead
const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-20 bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Client Testimonials
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Hear from our satisfied clients about their experience with Cirpman Homes Ltd
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-3 h-4 w-4 text-gray-400">🔍</span>
              <Input
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All Testimonials" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Testimonials</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="regular">Regular Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Testimonials Grid */}
         {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[...Array(6)].map((_, i) => (
               <Card key={i}>
                 <CardHeader>
                   <div className="flex items-center space-x-3">
                     <Skeleton className="h-12 w-12 rounded-full" />
                     <div>
                       <Skeleton className="h-4 w-24 mb-2" />
                       <Skeleton className="h-3 w-32" />
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-2">
                     <Skeleton className="h-3 w-full" />
                     <Skeleton className="h-3 w-3/4" />
                     <Skeleton className="h-3 w-1/2" />
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         ) : filteredTestimonials.length === 0 ? (
           <div className="text-center py-12">
             <div className="text-gray-500 text-lg mb-4">No testimonials found</div>
             <p className="text-gray-400">Try adjusting your search or filter criteria</p>
           </div>
         ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className={`group hover:shadow-lg transition-shadow ${
                testimonial.featured ? 'ring-2 ring-brand-gold' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {testimonial.client_photo_url ? (
                        <img
                          src={testimonial.client_photo_url}
                          alt={testimonial.client_name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-brand-gold flex items-center justify-center">
                          <span className="text-white font-bold">👤</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {testimonial.client_name}
                          </h3>
                          {testimonial.client_title && (
                            <p className="text-sm text-gray-600">
                              {testimonial.client_title}
                            </p>
                          )}
                          {testimonial.client_company && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <span>🏢</span>
                              {testimonial.client_company}
                            </p>
                          )}
                        </div>
                        {testimonial.featured && (
                          <Badge className="bg-brand-gold text-white">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center mt-2">
                        {renderStars(testimonial.rating)}
                        <span className="ml-2 text-sm text-gray-500">
                          {testimonial.rating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <span className="absolute -top-2 -left-2 h-6 w-6 text-brand-gold opacity-50 text-2xl">"</span>
                    <p className="text-gray-700 leading-relaxed pl-4">
                      "{testimonial.testimonial_text}"
                    </p>
                  </div>
                  {testimonial.property && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Property:</span> {testimonial.property.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Location:</span> {testimonial.property.location}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 text-xs text-gray-400">
                    {formatDate(testimonial.created_at)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        {testimonials.length > 0 && (
          <div className="mt-16">
            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                What Our Clients Say
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-brand-blue mb-2">
                    {testimonials.length}
                  </div>
                  <div className="text-gray-600">Total Testimonials</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-brand-gold mb-2">
                    {(testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)}
                  </div>
                  <div className="text-gray-600">Average Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-brand-blue mb-2">
                    {testimonials.filter(t => t.featured).length}
                  </div>
                  <div className="text-gray-600">Featured Reviews</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Testimonials;
