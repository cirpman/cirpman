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
import { Search, Star, MessageSquare, Reply, Eye, CheckCircle, Clock, User, Building } from 'lucide-react';
import { worker } from '@/lib/worker';

interface Feedback {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  rating: number;
  status: string;
  created_at: string;
  replied_at: string;
  reply_message: string;
  property: {
    title: string;
    location: string;
  };
}

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await worker.post('/get-feedbacks', {});
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }
      const data = await response.json();
      setFeedbacks(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch feedback: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || feedback.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    try {
      await worker.post('/update-feedback-status', { feedbackId, newStatus });
      toast.success('Feedback status updated successfully!');
      fetchFeedbacks();
    } catch (error: any) {
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const handleReply = async (feedbackId: string) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      await worker.post('/reply-to-feedback', { feedbackId, replyMessage });
      toast.success('Reply sent successfully!');
      setReplyDialogOpen(false);
      setReplyMessage('');
      setSelectedFeedback(null);
      fetchFeedbacks();
    } catch (error: any) {
      toast.error('Failed to send reply: ' + error.message);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      unread: { color: 'bg-red-100 text-red-800', label: 'Unread', icon: Clock },
      read: { color: 'bg-blue-100 text-blue-800', label: 'Read', icon: Eye },
      replied: { color: 'bg-green-100 text-green-800', label: 'Replied', icon: CheckCircle },
      resolved: { color: 'bg-gray-100 text-gray-800', label: 'Resolved', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unread;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Feedback Management</span>
          </CardTitle>
          <CardDescription>
            Review and respond to client feedback, track status, and manage customer satisfaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search feedback..."
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
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Feedback List */}
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-brand-gold flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {feedback.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {feedback.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(feedback.status)}
                        <div className="flex items-center">
                          {renderStars(feedback.rating)}
                          <span className="ml-1 text-sm text-gray-500">
                            {feedback.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {feedback.subject && (
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Subject: {feedback.subject}
                      </p>
                    )}

                    <p className="text-gray-700 mb-3 line-clamp-3">
                      {feedback.message}
                    </p>

                    {feedback.property && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                        <Building className="h-3 w-3" />
                        <span>Related Property: {feedback.property.title}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Submitted: {formatDate(feedback.created_at)}</span>
                      {feedback.replied_at && (
                        <span>Replied: {formatDate(feedback.replied_at)}</span>
                      )}
                    </div>

                    {feedback.reply_message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">Admin Reply:</p>
                        <p className="text-sm text-gray-700">{feedback.reply_message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFeedback(feedback);
                        setReplyDialogOpen(true);
                      }}
                      disabled={feedback.status === 'replied' || feedback.status === 'resolved'}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    
                    {feedback.status === 'unread' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(feedback.id, 'read')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                    )}

                    {feedback.status === 'read' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(feedback.id, 'resolved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}

                    {feedback.status === 'replied' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(feedback.id, 'resolved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Feedback</DialogTitle>
            <DialogDescription>
              Send a response to the client's feedback
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Original Feedback:</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>From:</strong> {selectedFeedback.name} ({selectedFeedback.email})
                </p>
                {selectedFeedback.subject && (
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Subject:</strong> {selectedFeedback.subject}
                  </p>
                )}
                <p className="text-sm text-gray-700">
                  <strong>Message:</strong> {selectedFeedback.message}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reply">Your Reply *</Label>
                <Textarea
                  id="reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Enter your response..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setReplyDialogOpen(false);
                    setReplyMessage('');
                    setSelectedFeedback(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleReply(selectedFeedback.id)}
                  disabled={!replyMessage.trim()}
                >
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedbackManagement;
