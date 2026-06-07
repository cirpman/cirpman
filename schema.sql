
-- Drop existing tables to ensure clean state (Caution: this erases data)
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS faqs;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS gallery;
DROP TABLE IF EXISTS newsletter_subscriptions;
DROP TABLE IF EXISTS payment_links;
DROP TABLE IF EXISTS progress_timeline;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS site_visit_bookings;
DROP TABLE IF EXISTS customer_subscriptions;
DROP TABLE IF EXISTS consultant_subscriptions;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS profiles;

-- Profiles Table (For Users & Auth)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY, -- Firebase UID or custom UUID
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'client', -- 'admin' or 'client'
    password_hash TEXT, -- For custom auth
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts
CREATE TABLE blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FAQs
CREATE TABLE faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback
CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'new',
    reply_message TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery
CREATE TABLE gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT NOT NULL,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter Subscriptions
CREATE TABLE newsletter_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Links
CREATE TABLE payment_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    amount REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Timeline
CREATE TABLE progress_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties
CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    google_maps TEXT,
    size_min REAL,
    size_max REAL,
    price_min REAL,
    price_max REAL,
    status TEXT DEFAULT 'available',
    progress TEXT,
    featured_image TEXT,
    images TEXT, -- JSON array
    videos TEXT, -- JSON array
    installment_available INTEGER DEFAULT 0,
    installment_config TEXT, -- JSON object
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Site Visit Bookings
CREATE TABLE site_visit_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    property_id INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    preferred_date TIMESTAMP,
    preferred_time TEXT,
    message TEXT,
    follow_up_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Customer Subscriptions
CREATE TABLE customer_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consultant Subscriptions
CREATE TABLE consultant_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials
CREATE TABLE testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name TEXT NOT NULL,
    client_title TEXT,
    client_company TEXT,
    testimonial_text TEXT NOT NULL,
    rating INTEGER,
    featured INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    client_photo_url TEXT,
    property_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id)
);
