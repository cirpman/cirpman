import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Star, User, Building, Upload, Check, X } from 'lucide-react';
import { worker } from '@/lib/worker';

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
  property_id?: string;
  property?: {
    id?: string;
    title: string;
    location: string;
  };
}

interface Property {
  id: string;
  title: string;
  location: string;
}

const TestimonialsManagement = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_title: '',
    client_company: '',
    testimonial_text: '',
    rating: 5,
    featured: false,
    status: 'pending',
    client_photo_url: '',
    property_id: 'null-property'
  });

  useEffect(() => {
    fetchTestimonials();
    fetchProperties();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await worker.post('/get-testimonials', {});
      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }
      const data = await response.json();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Failed to fetch testimonials: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await worker.post('/get-properties', { status: 'Available' });
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = 
      testimonial.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.testimonial_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (testimonial.client_company && testimonial.client_company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || testimonial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === 'null-property' ? '' : value,
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const uploadFile = async (file: File) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                const response = await worker.post("/upload", { file: base64, type: file.type });
                if (!response.ok) {
                    throw new Error('Failed to upload file');
                }
                const data = await response.json();
                resolve(data.url);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      try {
        const publicUrl = await uploadFile(file);
        setFormData(prev => ({
          ...prev,
          client_photo_url: publicUrl as string
        }));
        toast.success('Photo uploaded successfully!');
      } catch (error: any) {
        toast.error('Failed to upload photo: ' + error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const testimonialData = {
        ...formData,
        property_id: formData.property_id === '' ? null : formData.property_id,
      };

      if (editingTestimonial) {
        await worker.post('/update-testimonial', { id: editingTestimonial.id, ...testimonialData });
        toast.success('Testimonial updated successfully!');
      } else {
        await worker.post('/create-testimonial', testimonialData);
        toast.success('Testimonial created successfully!');
      }

      setDialogOpen(false);
      resetForm();
      fetchTestimonials();
    } catch (error: any) {
      toast.error('Failed to save testimonial: ' + error.message);
      console.error("Error saving testimonial:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      client_name: testimonial.client_name,
      client_title: testimonial.client_title || '',
      client_company: testimonial.client_company || '',
      testimonial_text: testimonial.testimonial_text,
      rating: testimonial.rating,
      featured: testimonial.featured,
      status: testimonial.status,
      client_photo_url: testimonial.client_photo_url || '',
      property_id: testimonial.property_id || testimonial.property?.id || 'null-property'
    });
    setDialogOpen(true);
  };

  const handleDelete = async (testimonialId: string) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await worker.post('/delete-testimonial', { testimonialId });
        toast.success('Testimonial deleted successfully!');
        fetchTestimonials();
      } catch (error: any) {
        toast.error('Failed to delete testimonial: ' + error.message);
      }
    }
  };

  const handleStatusChange = async (testimonialId: string, newStatus: string) => {
    try {
      await worker.post('/update-testimonial-status', { testimonialId, newStatus });
      toast.success('Testimonial status updated successfully!');
      fetchTestimonials();
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_title: '',
      client_company: '',
      testimonial_text: '',
      rating: 5,
      featured: false,
      status: 'pending',
      client_photo_url: '',
      property_id: 'null-property'
    });
    setEditingTestimonial(null);
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => interactive && handleRatingChange(i + 1)}
        className={`h-5 w-5 transition-colors ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300 hover:text-yellow-300'
        } ${interactive ? 'cursor-pointer' : ''}`}
        disabled={!interactive}
      >
        <Star className="h-full w-full" />
      </button>
    ));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Testimonials Management</span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Testimonial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Create New Testimonial'}</DialogTitle>
                  <DialogDescription>
                    {editingTestimonial ? 'Update the testimonial details below.' : 'Fill in the details to create a new testimonial.'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client_name">Client Name *</Label>
                      <Input
                        id="client_name"
                        name="client_name"
                        value={formData.client_name}
                        onChange={handleInputChange}
                        placeholder="Enter client name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client_title">Client Title</Label>
                      <Input
                        id="client_title"
                        name="client_title"
                        value={formData.client_title}
                        onChange={handleInputChange}
                        placeholder="e.g., CEO, Manager"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_company">Company</Label>
                    <Input
                      id="client_company"
                      name="client_company"
                      value={formData.client_company}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex items-center space-x-2">
                      {renderStars(formData.rating, true)}
                      <span className="ml-2 text-sm text-gray-500">
                        {formData.rating}/5
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testimonial_text">Testimonial Text *</Label>
                    <Textarea
                      id="testimonial_text"
                      name="testimonial_text"
                      value={formData.testimonial_text}
                      onChange={handleInputChange}
                      placeholder="Enter the testimonial text..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="property_id">Related Property</Label>
                      <Select value={formData.property_id} onValueChange={(value) => handleSelectChange('property_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null-property">No specific property</SelectItem>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.title} - {property.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_photo">Client Photo</Label>
                    <Input
                      id="client_photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="featured">Featured Testimonial</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : (editingTestimonial ? 'Update Testimonial' : 'Create Testimonial')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Manage client testimonials, approve submissions, and feature the best reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Testimonials List */}
          <div className="space-y-4">
            {filteredTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {testimonial.client_photo_url ? (
                          <img
                            src={testimonial.client_photo_url}
                            alt={testimonial.client_name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-brand-gold flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
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
                                <Building className="h-3 w-3" />
                                {testimonial.client_company}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {testimonial.featured && (
                              <Badge className="bg-brand-gold text-white">
                                Featured
                              </Badge>
                            )}
                            {getStatusBadge(testimonial.status)}
                          </div>
                        </div>
                        <div className="flex items-center mt-2">
                          {renderStars(testimonial.rating)}
                          <span className="ml-2 text-sm text-gray-500">
                            {testimonial.rating}/5
                          </span>
                        </div>
                        <p className="text-gray-700 mt-2 line-clamp-2">
                          "{testimonial.testimonial_text}"
                        </p>
                        {testimonial.property && (
                          <p className="text-sm text-gray-500 mt-2">
                            <span className="font-medium">Property:</span> {testimonial.property.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(testimonial)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {testimonial.status === 'pending' && (
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(testimonial.id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(testimonial.id, 'rejected')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(testimonial.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestimonialsManagement;
