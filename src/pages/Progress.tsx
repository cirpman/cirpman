import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from 'lucide-react';
import { toast } from "sonner";

interface ProgressItem {
  id: string;
  title: string;
  description: string;
  date: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
}

const Progress = () => {
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressItems();
  }, []);

  const fetchProgressItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('Failed to fetch progress items');
      const data = await res.json();
      setProgressItems(Array.isArray(data) ? data : data.progress || []);
    } catch (error: any) {
      toast.error('Failed to fetch progress items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-brand-blue mb-4">Project Progress</h1>
            <p className="text-xl text-gray-600">Follow our journey as we develop and deliver premium real estate projects</p>
          </div>

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
          ) : progressItems.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Progress Updates</h3>
              <p className="text-gray-500">Progress updates will appear here as they become available.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {progressItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-brand-blue to-brand-gold">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white mb-2">{item.title}</CardTitle>
                        <div className="flex items-center text-gray-200">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Progress;
