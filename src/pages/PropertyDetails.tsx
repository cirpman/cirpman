import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { resolveAssetPath } from '@/lib/assets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { worker } from '@/lib/worker';

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await worker.post('/get-properties', {});
        if (!res.ok) throw new Error('Failed to fetch properties');
        const data = await res.json();
        const found = (data || []).find((p: any) => String(p.id) === String(id));
        if (!found) throw new Error('Property not found');
        setProperty(found);
      } catch (err: any) {
        toast.error('Failed to load property: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProperty();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center py-12">Loading...</div>;
  if (!property) return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-4xl mx-auto py-20 px-4">Property not found</div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-4xl mx-auto py-20 px-4">
        <Card>
          <div className="aspect-video bg-gray-100">
            {property.images && property.images.length > 0 ? (
              <img src={resolveAssetPath(property.images[0])} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Building className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          <CardHeader>
            <CardTitle className="text-2xl text-brand-blue">{property.title}</CardTitle>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="h-4 w-4 mr-1" />{property.location}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{property.description}</p>
            <div className="flex items-center gap-4">
              <Link to="/properties">
                <Button variant="outline">Back to listings</Button>
              </Link>
              <Button className="bg-brand-gold text-brand-blue">Contact Agent</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PropertyDetails;
