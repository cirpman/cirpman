import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Plus, Trash2, Images, X } from 'lucide-react';
import { toast } from "sonner";
import { worker } from '@/lib/worker';

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

const GalleryManagementEnhanced = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Drone Shots',
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    setLoading(true);
    try {
      const response = await worker.post('/get-gallery-items', {});
      if (!response.ok) {
        throw new Error('Failed to fetch gallery items');
      }
      const data = await response.json();
      setGalleryItems(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch gallery items: ' + error.message);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.title || mediaFiles.length === 0) {
      toast.error('Please fill in the title and select at least one file');
      return;
    }

    setLoading(true);

    try {
      const uploadPromises = mediaFiles.map(file => uploadFile(file));
      const uploadResults = await Promise.all(uploadPromises);

      const newGalleryItems = mediaFiles.map((file, index) => ({
        title: uploadForm.title,
        description: uploadForm.description || null,
        category: uploadForm.category as any,
        image_url: file.type.startsWith('image') ? uploadResults[index] : null,
        video_url: file.type.startsWith('video') ? uploadResults[index] : null
      }));

      await worker.post('/create-gallery-items', { galleryItems: newGalleryItems });

      toast.success('Gallery items uploaded successfully!');
      setShowUploadForm(false);
      setUploadForm({ title: '', description: '', category: 'Drone Shots' });
      setMediaFiles([]);
      fetchGalleryItems();
    } catch (error: any) {
      toast.error(`Failed to upload: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteGalleryItem = async (id: string) => {
    try {
      await worker.post('/delete-gallery-item', { id });
      fetchGalleryItems();
    } catch (error: any) {
      toast.error('Failed to delete item: ' + error.message);
    }
  };

  const addMediaFile = (file: File) => {
    if (mediaFiles.length < 20) {
      setMediaFiles(prev => [...prev, file]);
    } else {
      toast.error('Maximum 20 files allowed');
    }
  };

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading && galleryItems.length === 0) {
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
                <Images className="h-5 w-5" />
                <span>Gallery Management</span>
              </CardTitle>
              <CardDescription>
                Manage photos and videos for the gallery
              </CardDescription>
            </div>
            <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
              <DialogTrigger asChild>
                <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Media
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Upload Gallery Media</h3>
                    <p className="text-sm text-gray-600">Upload photos and videos to the gallery</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={uploadForm.title}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter media title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter media description"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={uploadForm.category} 
                        onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Drone Shots">Drone Shots</SelectItem>
                          <SelectItem value="Allocation Events">Allocation Events</SelectItem>
                          <SelectItem value="Construction">Construction</SelectItem>
                          <SelectItem value="Events">Events</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Media Files (Max 20)</Label>
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
                      <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue"
                      >
                        {loading ? 'Uploading...' : 'Upload Media'}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {galleryItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 relative">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : item.video_url ? (
                      <video 
                        src={item.video_url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Images className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => deleteGalleryItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{item.category}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Images className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Gallery Items</h3>
              <p className="text-gray-500">Upload your first photo or video to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GalleryManagementEnhanced;