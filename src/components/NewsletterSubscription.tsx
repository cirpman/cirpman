import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Check } from 'lucide-react';

interface NewsletterSubscriptionProps {
  variant?: 'inline' | 'card';
  title?: string;
  description?: string;
  className?: string;
}

const NewsletterSubscription = ({ 
  variant = 'card', 
  title = "Stay Updated", 
  description = "Subscribe to our newsletter for the latest property updates and exclusive offers.",
  className = ""
}: NewsletterSubscriptionProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          source: 'website_subscription'
        })
      });

      if (!res.ok) {
        const error = await res.json();
        if (res.status === 409) {
          toast.error('This email is already subscribed to our newsletter');
        } else {
          throw new Error(error.message || 'Failed to subscribe');
        }
      } else {
        toast.success('Successfully subscribed to our newsletter!');
        setSubscribed(true);
        setEmail('');
        setName('');
      }
    } catch (error: any) {
      toast.error('Failed to subscribe: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <span className="text-4xl text-green-500 mx-auto mb-2 block">✓</span>
        <h3 className="text-lg font-semibold text-green-800 mb-1">Thank You!</h3>
        <p className="text-green-700">You've been successfully subscribed to our newsletter.</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSubscribed(false)}
          className="mt-3"
        >
          Subscribe Another Email
        </Button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
        <div className="flex-1">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            disabled={loading}
          />
        </div>
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-brand-gold hover:bg-brand-gold/90 text-brand-blue"
        >
          {loading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-brand-blue to-brand-blue/90 text-white rounded-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <Mail className="h-8 w-8 mx-auto mb-3 text-brand-gold" />
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-white/90">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-white/90 text-sm">
            Name (Optional)
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-white/90 text-sm">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            required
            disabled={loading}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-brand-gold hover:bg-brand-gold/90 text-brand-blue font-semibold"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-blue mr-2"></div>
              Subscribing...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Subscribe to Newsletter
            </>
          )}
        </Button>

        <p className="text-xs text-white/70 text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </form>
    </div>
  );
};

export default NewsletterSubscription;
