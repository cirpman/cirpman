-- Combined Migration File for Supabase

-- Create enum types
CREATE TYPE property_status AS ENUM ('Available', 'Reserved', 'Sold');
CREATE TYPE property_progress AS ENUM ('Planned', 'In Progress', 'Completed');
CREATE TYPE user_role AS ENUM ('client', 'admin');
CREATE TYPE gallery_category AS ENUM ('Drone Shots', 'Allocation Events', 'Construction', 'Events');
CREATE TYPE payment_status AS ENUM ('On Track', 'Overdue', 'Completed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  size_min INTEGER NOT NULL,
  size_max INTEGER NOT NULL,
  price_min NUMERIC NOT NULL,
  price_max NUMERIC NOT NULL,
  status property_status NOT NULL DEFAULT 'Available',
  progress property_progress NOT NULL DEFAULT 'Planned',
  images TEXT[],
  videos TEXT[],
  installment_available BOOLEAN DEFAULT false,
  featured_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery table
CREATE TABLE public.gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  category gallery_category NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create progress timeline table
CREATE TABLE public.progress_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create site visit bookings table
CREATE TABLE public.site_visit_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  message TEXT,
  follow_up_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property bookings table
CREATE TABLE public.property_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  property_id UUID NOT NULL REFERENCES public.properties,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create installment plans table
CREATE TABLE public.installment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.property_bookings,
  total_amount NUMERIC NOT NULL,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  next_payment_date DATE,
  next_payment_amount NUMERIC,
  status payment_status NOT NULL DEFAULT 'On Track',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payment history table
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_plan_id UUID NOT NULL REFERENCES public.installment_plans,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  meta_description TEXT,
  view_count INTEGER DEFAULT 0
);

-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  client_name TEXT NOT NULL,
  client_title TEXT,
  client_company TEXT,
  testimonial_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  client_photo_url TEXT,
  property_id UUID REFERENCES public.properties(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create faq table
CREATE TABLE public.faq (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id)
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'resolved')),
  user_id UUID REFERENCES auth.users(id),
  property_id UUID REFERENCES public.properties(id),
  replied_by UUID REFERENCES auth.users(id),
  replied_at TIMESTAMP WITH TIME ZONE,
  reply_message TEXT
);

-- Create newsletter_subscriptions table
CREATE TABLE public.newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source TEXT DEFAULT 'contact_form',
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id)
);

-- Create customer_subscriptions table
CREATE TABLE public.customer_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  surname TEXT NOT NULL,
  middle_name TEXT,
  first_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  marital_status TEXT NOT NULL,
  contact_address TEXT NOT NULL,
  email TEXT NOT NULL,
  occupation TEXT NOT NULL,
  referred_by TEXT,
  designation TEXT,
  phone TEXT NOT NULL,
  selected_packages TEXT[] NOT NULL,
  duration TEXT NOT NULL,
  payment_plan TEXT NOT NULL,
  plot_size TEXT NOT NULL,
  number_of_plots TEXT NOT NULL,
  next_of_kin_surname TEXT NOT NULL,
  next_of_kin_other_names TEXT NOT NULL,
  next_of_kin_address TEXT NOT NULL,
  next_of_kin_phone TEXT NOT NULL,
  next_of_kin_id_number TEXT,
  next_of_kin_relationship TEXT NOT NULL,
  digital_signature TEXT NOT NULL,
  date DATE NOT NULL,
  passport_photo_url TEXT,
  installment_preview JSONB,
  status TEXT DEFAULT 'pending' NOT NULL,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_amount DECIMAL(12,2),
  payment_date TIMESTAMP WITH TIME ZONE
);

-- Create consultant_subscriptions table
CREATE TABLE public.consultant_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  marital_status TEXT NOT NULL,
  contact_address TEXT NOT NULL,
  email TEXT NOT NULL,
  occupation TEXT NOT NULL,
  employer TEXT,
  referred_by TEXT,
  designation TEXT,
  placement TEXT,
  phone TEXT NOT NULL,
  id_number TEXT NOT NULL,
  next_of_kin_surname TEXT NOT NULL,
  next_of_kin_other_names TEXT NOT NULL,
  next_of_kin_address TEXT NOT NULL,
  next_of_kin_phone TEXT NOT NULL,
  next_of_kin_relationship TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  digital_signature TEXT NOT NULL,
  date DATE NOT NULL,
  passport_photo_url TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_amount DECIMAL(12,2),
  payment_date TIMESTAMP WITH TIME ZONE
);

-- Create rate_limits table
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ip TEXT NOT NULL,
  user_agent TEXT,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='blog_posts') THEN
    CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='testimonials') THEN
    CREATE TRIGGER testimonials_set_updated_at BEFORE UPDATE ON public.testimonials
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='faq') THEN
    CREATE TRIGGER faq_set_updated_at BEFORE UPDATE ON public.faq
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='feedback') THEN
    CREATE TRIGGER feedback_set_updated_at BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='newsletter_subscriptions') THEN
    CREATE TRIGGER newsletter_subscriptions_set_updated_at BEFORE UPDATE ON public.newsletter_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='customer_subscriptions') THEN
    CREATE TRIGGER customer_subscriptions_set_updated_at BEFORE UPDATE ON public.customer_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='consultant_subscriptions') THEN
    CREATE TRIGGER consultant_subscriptions_set_updated_at BEFORE UPDATE ON public.consultant_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Enable realtime for all tables
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.gallery REPLICA IDENTITY FULL;
ALTER TABLE public.progress_timeline REPLICA IDENTITY FULL;
ALTER TABLE public.site_visit_bookings REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.property_bookings REPLICA IDENTITY FULL;
ALTER TABLE public.installment_plans REPLICA IDENTITY FULL;
ALTER TABLE public.blog_posts REPLICA IDENTITY FULL;
ALTER TABLE public.testimonials REPLICA IDENTITY FULL;
ALTER TABLE public.faq REPLICA IDENTITY FULL;
ALTER TABLE public.feedback REPLICA IDENTITY FULL;
ALTER TABLE public.newsletter_subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.customer_subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.consultant_subscriptions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery;
ALTER PUBLICATION supabase_realtime ADD TABLE public.progress_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visit_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.property_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.installment_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.faq;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.newsletter_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultant_subscriptions;

-- Add RLS policies
-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Admins can manage properties" ON public.properties FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Additional RLS policies for other tables can be added here...
