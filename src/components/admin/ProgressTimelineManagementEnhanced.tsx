import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Calendar, Upload, X } from 'lucide-react';
import { toast } from "sonner";
import { worker } from '@/lib/worker';

interface ProgressTimelineItem {
  id: string;
  title: string;
  description: string | null;
  date: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

const ProgressTimelineManagementEnhanced = () => {
  const [timelineItems, setTimelineItems] = useState<ProgressTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchTimelineItems();
  }, []);

  // Optional: basic polling to keep timeline reasonably fresh
  useEffect(() => {
    const interval = setInterval(fetchTimelineItems, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTimelineItems = async () => {
    try {
      const response = await worker.post('/get-progress-timeline-items', {});
      if (!response.ok) {
        throw new Error('Failed to fetch progress timeline');
      }
      const data = await response.json();
      setTimelineItems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error('Failed to fetch progress timeline: ' + error.message);
    } finally {
      setLoading(false);
    }
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
                resolve({ url: data.url, isVideo: file.type.startsWith('video/') });
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date) {
      toast.error('Please fill in the title and date');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      let videoUrl = null;

      // Upload media files if any
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(file => uploadFile(file));
        const uploadResults = await Promise.all(uploadPromises as any);
        
        // Use the first image and first video
        const firstImage = uploadResults.find((result: any) => !result.isVideo);
        const firstVideo = uploadResults.find((result: any) => result.isVideo);
        
        imageUrl = firstImage?.url || null;
        videoUrl = firstVideo?.url || null;
      }

      await worker.post('/create-progress-timeline-item', {
        title: formData.title,
        description: formData.description || null,
        date: formData.date,
        image_url: imageUrl,
        video_url: videoUrl,
      });

      toast.success('Progress update added successfully!');
      setShowAddForm(false);
      setFormData({ title: '', description: '', date: new Date().toISOString().split('T')[0] });
      setMediaFiles([]);
      fetchTimelineItems();
    } catch (error: any) {
      toast.error(`Failed to add progress update: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTimelineItem = async (id: string) => {
    try {
      await worker.post('/delete-progress-timeline-item', { id });
      // Optimistically update local state
      setTimelineItems(prev => prev.filter(item => item.id !== id));
      toast.success('Progress update deleted!');
    } catch (error: any) {
      toast.error('Failed to delete item: ' + error.message);
    }
  };

  const addMediaFile = (file: File) => {
    if (mediaFiles.length < 5) {
      setMediaFiles(prev => [...prev, file]);
    } else {
      toast.error('Maximum 5 files allowed');
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading && timelineItems.length === 0) {
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Progress Timeline Management</span>
              </CardTitle>
              <CardDescription>
                Track and share construction progress updates
              </CardDescription>
            </div>
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Update
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Add Progress Update</h3>
                    <p className="text-sm text-gray-600">Share the latest construction progress</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter progress update title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the progress update"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Media Files (Max 5)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach(addMediaFile);
                          }}
                          className="hidden"
                          id="media-files"
                        />
                        <label htmlFor="media-files" className="cursor-pointer">
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-600">Upload photos and videos</span>
                          </div>
                        </label>
                      </div>
                      {mediaFiles.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          {mediaFiles.map((file, index) => (
                            <div key={index} className="relative">
                              <div className="bg-gray-100 rounded p-2 text-xs truncate">
                                {file.name}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMediaFile(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue"
                      >
                        {loading ? 'Adding...' : 'Add Update'}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {timelineItems.length > 0 ? (
            <div className="space-y-6">
              {timelineItems.map((item, index) => (
                <div key={item.id} className="relative">
                  {index !== timelineItems.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-brand-gold"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-brand-gold rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-brand-blue" />
                    </div>
                    
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {new Date(item.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            {item.description && (
                              <p className="text-gray-700 mb-4">{item.description}</p>
                            )}
                            
                            {/* Media Display */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {item.image_url && (
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <img 
                                    src={item.image_url} 
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              {item.video_url && (
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                  <video 
                                    src={item.video_url}
                                    className="w-full h-full object-cover"
                                    controls
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteTimelineItem(item.id)}
                            className="ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Updates</h3>
              <p className="text-gray-500">Add your first progress update to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTimelineManagementEnhanced;
