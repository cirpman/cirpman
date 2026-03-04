import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Plus, X } from 'lucide-react';
import { worker } from '@/lib/worker';

interface PropertyUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  property?: any;
}

const PropertyUploadForm: React.FC<PropertyUploadFormProps> = ({ onSuccess, onCancel, property }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: property?.title || '',
    description: property?.description || '',
    location: property?.location || '',
    google_maps: property?.google_maps || '',
    size_min: property?.size_min?.toString() || '',
    size_max: property?.size_max?.toString() || '',
    price_min: property?.price_min?.toString() || '',
    price_max: property?.price_max?.toString() || '',
    status: property?.status || 'Available',
    progress: property?.progress || 'Planned',
    installment_available: property?.installment_available || false
  });

  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [installmentConfig, setInstallmentConfig] = useState({
    duration: '12',
    minDepositPercent: '',
    interestRate: '',
    pricePerSqm: '',
    minSqm: '',
    maxSqm: '',
  });
  const [installmentPreview, setInstallmentPreview] = useState({
    firstDeposit: 0,
    monthly: 0,
    total: 0,
  });

  React.useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        location: property.location || '',
        google_maps: property.google_maps || '',
        size_min: property.size_min?.toString() || '',
        size_max: property.size_max?.toString() || '',
        price_min: property.price_min?.toString() || '',
        price_max: property.price_max?.toString() || '',
        status: property.status || 'Available',
        progress: property.progress || 'Planned',
        installment_available: property.installment_available || false
      });
      // No file objects for images/videos, so skip for now
    }
  }, [property]);

  React.useEffect(() => {
    if (property && property.installment_config) {
      setInstallmentConfig({
        duration: property.installment_config.duration?.toString() || '12',
        minDepositPercent: property.installment_config.minDepositPercent?.toString() || '',
        interestRate: property.installment_config.interestRate?.toString() || '',
        pricePerSqm: property.installment_config.pricePerSqm?.toString() || '',
        minSqm: property.installment_config.minSqm?.toString() || '',
        maxSqm: property.installment_config.maxSqm?.toString() || '',
      });
    }
  }, [property]);

  React.useEffect(() => {
    // Only calculate if all fields are filled
    const { duration, minDepositPercent, interestRate, pricePerSqm, minSqm, maxSqm } = installmentConfig;
    if (
      formData.installment_available &&
      duration && minDepositPercent && interestRate && pricePerSqm && minSqm && maxSqm
    ) {
      const sqm = Number(minSqm);
      const price = Number(pricePerSqm) * sqm;
      const deposit = (Number(minDepositPercent) / 100) * price;
      const principal = price - deposit;
      const months = Number(duration);
      const monthlyInterest = Number(interestRate) / 100;
      // Simple interest for each month
      const monthly = (principal * (1 + monthlyInterest * months)) / months;
      setInstallmentPreview({
        firstDeposit: deposit,
        monthly,
        total: deposit + monthly * months,
      });
    } else {
      setInstallmentPreview({ firstDeposit: 0, monthly: 0, total: 0 });
    }
  }, [installmentConfig, formData.installment_available]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, installment_available: checked }));
  };

  const handleInstallmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInstallmentConfig(prev => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file: File) => {
    try {
      // 1. Get presigned URL from worker
      const response = await worker.post("/get-upload-url", {
        fileName: file.name,
        fileType: file.type
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, publicUrl } = await response.json();

      // 2. Upload directly to R2 using the presigned URL
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
      }

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File, type: 'featured' | 'images' | 'videos') => {
    try {
      const url = await uploadFile(file);
      return url;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.location || !formData.size_min || !formData.price_min) {
        throw new Error('Please fill in all required fields');
      }

      // Upload featured image
      let featuredImageUrl = property?.featured_image || '';
      if (featuredImageFile) {
        featuredImageUrl = await handleFileUpload(featuredImageFile, 'featured');
      }

      // Upload additional images
      let imageUrls = property?.images || [];
      if (images.length > 0) {
        const uploaded = await Promise.all(images.map(img => handleFileUpload(img, 'images')));
        imageUrls = [...imageUrls, ...uploaded];
      }

      // Upload videos
      let videoUrls = property?.videos || [];
      if (videos.length > 0) {
        const uploaded = await Promise.all(videos.map(video => handleFileUpload(video, 'videos')));
        videoUrls = [...videoUrls, ...uploaded];
      }

      // Create property record
      const propertyData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        google_maps: formData.google_maps,
        size_min: parseInt(formData.size_min),
        size_max: parseInt(formData.size_max || formData.size_min),
        price_min: parseFloat(formData.price_min),
        price_max: parseFloat(formData.price_max || formData.price_min),
        status: formData.status,
        progress: formData.progress,
        featured_image: featuredImageUrl,
        images: imageUrls,
        videos: videoUrls,
        installment_available: formData.installment_available,
        ...(formData.installment_available ? {
          installment_config: {
            duration: Number(installmentConfig.duration),
            minDepositPercent: Number(installmentConfig.minDepositPercent),
            interestRate: Number(installmentConfig.interestRate),
            pricePerSqm: Number(installmentConfig.pricePerSqm),
            minSqm: Number(installmentConfig.minSqm),
            maxSqm: Number(installmentConfig.maxSqm),
          }
        } : {}),
      };

      if (property) {
        await worker.post('/update-property', { id: property.id, ...propertyData });
      } else {
        await worker.post('/create-property', propertyData);
      }

      toast.success(property ? 'Property updated successfully!' : 'Property uploaded successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving property:', error);
      toast.error(`Failed to ${property ? 'update' : 'upload'} property: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addImageFile = (file: File) => {
    if (images.length < 10) {
      setImages(prev => [...prev, file]);
    } else {
      toast.error('Maximum 10 images allowed');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addVideoFile = (file: File) => {
    if (videos.length < 5) {
      setVideos(prev => [...prev, file]);
    } else {
      toast.error('Maximum 5 videos allowed');
    }
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{property ? 'Edit Property' : 'Upload New Property'}</CardTitle>
        <CardDescription>{property ? 'Edit property details' : 'Add a new property to the portfolio'}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter property title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter property location"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google_maps">Google Maps Location</Label>
              <Input
                id="google_maps"
                name="google_maps"
                value={formData.google_maps || ''}
                onChange={handleInputChange}
                placeholder="Enter Google Maps link or coordinates"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter property description"
              rows={4}
            />
          </div>

          {/* Size Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="size_min">Minimum Size (sqm) *</Label>
              <Input
                id="size_min"
                name="size_min"
                type="number"
                value={formData.size_min}
                onChange={handleInputChange}
                placeholder="Enter minimum size"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size_max">Maximum Size (sqm)</Label>
              <Input
                id="size_max"
                name="size_max"
                type="number"
                value={formData.size_max}
                onChange={handleInputChange}
                placeholder="Enter maximum size (optional)"
              />
            </div>
          </div>

          {/* Price Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price_min">Minimum Price (NGN) *</Label>
              <Input
                id="price_min"
                name="price_min"
                type="number"
                value={formData.price_min}
                onChange={handleInputChange}
                placeholder="Enter minimum price"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_max">Maximum Price (NGN)</Label>
              <Input
                id="price_max"
                name="price_max"
                type="number"
                value={formData.price_max}
                onChange={handleInputChange}
                placeholder="Enter maximum price (optional)"
              />
            </div>
          </div>

          {/* Status and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Property Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Construction Progress</Label>
              <Select value={formData.progress} onValueChange={(value) => handleSelectChange('progress', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planned">Planned</SelectItem>
                  <SelectItem value="Foundation">Foundation</SelectItem>
                  <SelectItem value="Structure">Structure</SelectItem>
                  <SelectItem value="Finishing">Finishing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Installment Payment Option */}
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.installment_available}
              onCheckedChange={handleSwitchChange}
            />
            <Label>Installment payments available</Label>
          </div>
          {formData.installment_available && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-4 rounded bg-gray-50 mt-2">
              <div className="space-y-2">
                <Label>Duration (months)</Label>
                <select
                  name="duration"
                  value={installmentConfig.duration}
                  onChange={handleInstallmentChange}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="3">3</option>
                  <option value="6">6</option>
                  <option value="12">12</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Min First Deposit (%)</Label>
                <Input
                  name="minDepositPercent"
                  type="number"
                  min="1"
                  max="99"
                  value={installmentConfig.minDepositPercent}
                  onChange={handleInstallmentChange}
                  placeholder="e.g. 20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Interest Rate (%)</Label>
                <Input
                  name="interestRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={installmentConfig.interestRate}
                  onChange={handleInstallmentChange}
                  placeholder="e.g. 2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Price per sqm (NGN)</Label>
                <Input
                  name="pricePerSqm"
                  type="number"
                  min="1"
                  value={installmentConfig.pricePerSqm}
                  onChange={handleInstallmentChange}
                  placeholder="e.g. 50000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Min Sqm</Label>
                <Input
                  name="minSqm"
                  type="number"
                  min="1"
                  value={installmentConfig.minSqm}
                  onChange={handleInstallmentChange}
                  placeholder="e.g. 300"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Max Sqm</Label>
                <Input
                  name="maxSqm"
                  type="number"
                  min={installmentConfig.minSqm || 1}
                  value={installmentConfig.maxSqm}
                  onChange={handleInstallmentChange}
                  placeholder="e.g. 600"
                  required
                />
              </div>
              <div className="col-span-2 mt-2">
                <div className="p-3 bg-white border rounded">
                  <div className="font-semibold mb-1">Installment Breakdown Preview</div>
                  <div>First Deposit: <span className="font-bold">₦{installmentPreview.firstDeposit.toLocaleString()}</span></div>
                  <div>Monthly Payment: <span className="font-bold">₦{installmentPreview.monthly.toLocaleString()}</span></div>
                  <div>Total (Deposit + Installments): <span className="font-bold">₦{installmentPreview.total.toLocaleString()}</span></div>
                  <div className="text-xs text-gray-500 mt-1">* Based on minimum sqm and price per sqm</div>
                </div>
              </div>
            </div>
          )}

          {/* Featured Image Upload */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFeaturedImageFile(file);
                }}
                className="hidden"
                id="featured-image"
              />
              <label htmlFor="featured-image" className="cursor-pointer">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-900">
                      {featuredImageFile ? featuredImageFile.name : 'Upload featured image'}
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Images Upload */}
          <div className="space-y-2">
            <Label>Additional Images (Max 10)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(addImageFile);
                }}
                className="hidden"
                id="additional-images"
              />
              <label htmlFor="additional-images" className="cursor-pointer">
                <div className="text-center">
                  <Plus className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Add images</span>
                </div>
              </label>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="bg-gray-100 rounded p-2 text-xs truncate">
                      {image.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos Upload */}
          <div className="space-y-2">
            <Label>Videos (Max 5)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(addVideoFile);
                }}
                className="hidden"
                id="videos"
              />
              <label htmlFor="videos" className="cursor-pointer">
                <div className="text-center">
                  <Plus className="mx-auto h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Add videos</span>
                </div>
              </label>
            </div>
            {videos.length > 0 && (
              <div className="space-y-2 mt-4">
                {videos.map((video, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 rounded p-2">
                    <span className="text-xs truncate">{video.name}</span>
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue"
            >
              {loading ? (property ? 'Updating...' : 'Uploading...') : (property ? 'Update Property' : 'Upload Property')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PropertyUploadForm;
