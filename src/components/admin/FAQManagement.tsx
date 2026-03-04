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
import { Search, Plus, Edit, Trash2, HelpCircle, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { worker } from '@/lib/worker';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const FAQManagement = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    try {
      const response = await worker.post('/get-faqs', {});
      if (!response.ok) {
        throw new Error('Failed to fetch FAQ');
      }
      const data = await response.json();
      setFaqs(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch FAQ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || faq.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(faqs.map(faq => faq.category))];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order_index' ? parseInt(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingFAQ) {
        await worker.post('/update-faq', { ...formData, id: editingFAQ.id });
        toast.success('FAQ updated successfully!');
      } else {
        await worker.post('/create-faq', formData);
        toast.success('FAQ created successfully!');
      }

      setDialogOpen(false);
      resetForm();
      fetchFAQs();
    } catch (error: any) {
      toast.error('Failed to save FAQ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      order_index: faq.order_index,
      is_active: faq.is_active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (faqId: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await worker.post('/delete-faq', { id: faqId });
        toast.success('FAQ deleted successfully!');
        fetchFAQs();
      } catch (error: any) {
        toast.error('Failed to delete FAQ: ' + error.message);
      }
    }
  };

  const handleToggleActive = async (faqId: string, currentStatus: boolean) => {
    try {
      await worker.post('/toggle-faq-status', { id: faqId, is_active: !currentStatus });
      toast.success(`FAQ ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchFAQs();
    } catch (error: any) {
      toast.error('Failed to update FAQ status: ' + error.message);
    }
  };

  const handleMove = async (faqId: string, direction: 'up' | 'down') => {
    try {
        await worker.post('/move-faq', { id: faqId, direction });
        toast.success(`FAQ moved ${direction} successfully!`);
        fetchFAQs();
    } catch (error: any) {
        toast.error('Failed to move FAQ: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      order_index: 0,
      is_active: true
    });
    setEditingFAQ(null);
  };

  const groupedFAQs = filteredFAQs.reduce((groups, faq) => {
    const category = faq.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(faq);
    return groups;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>FAQ Management</span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New FAQ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}</DialogTitle>
                  <DialogDescription>
                    {editingFAQ ? 'Update the FAQ details below.' : 'Fill in the details to create a new FAQ entry.'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="question">Question *</Label>
                    <Input
                      id="question"
                      name="question"
                      value={formData.question}
                      onChange={handleInputChange}
                      placeholder="Enter the question"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="answer">Answer *</Label>
                    <Textarea
                      id="answer"
                      name="answer"
                      value={formData.answer}
                      onChange={handleInputChange}
                      placeholder="Enter the answer..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="properties">Properties</SelectItem>
                          <SelectItem value="payments">Payments</SelectItem>
                          <SelectItem value="installments">Installments</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order_index">Order Index</Label>
                      <Input
                        id="order_index"
                        name="order_index"
                        type="number"
                        value={formData.order_index}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : (editingFAQ ? 'Update FAQ' : 'Create FAQ')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Manage frequently asked questions, organize by categories, and control visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FAQ List */}
          <div className="space-y-6">
            {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                  {category} ({categoryFAQs.length})
                </h3>
                <div className="space-y-3">
                  {categoryFAQs.map((faq, index) => (
                    <Card key={faq.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <HelpCircle className="h-4 w-4 text-brand-blue" />
                            <h4 className="font-medium text-gray-900">
                              {faq.question}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {faq.is_active ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                              <Badge variant="outline">
                                Order: {faq.order_index}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMove(faq.id, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMove(faq.id, 'down')}
                              disabled={index === categoryFAQs.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(faq)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(faq.id, faq.is_active)}
                          >
                            {faq.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(faq.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQManagement;
