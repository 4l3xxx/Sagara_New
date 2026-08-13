-- Database Schema Template for Sagara Revamp
-- This file contains all the table structures used in the project.

-- Create consultation_requests table
CREATE TABLE IF NOT EXISTS consultation_requests (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    business_email TEXT NOT NULL,
    service_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
    id SERIAL PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_id TEXT NOT NULL,
    subtitle_en TEXT,
    subtitle_id TEXT,
    industry TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_id TEXT NOT NULL,
    impact_en TEXT,
    impact_id TEXT,
    image_url TEXT,
    case_study_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create about_sections table
CREATE TABLE IF NOT EXISTS about_sections (
    section_key TEXT PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_id TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_id TEXT NOT NULL,
    stats JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (Admin Login)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    service_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    author_id UUID NOT NULL,
    category_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    client_name TEXT NOT NULL,
    company TEXT,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    photo TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create media table
CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deal_outcomes table for objective verification
CREATE TABLE IF NOT EXISTS deal_outcomes (
    id SERIAL PRIMARY KEY,
    deal_id VARCHAR(50) REFERENCES consultation_requests(id) ON DELETE CASCADE,
    outcome VARCHAR(20) NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    evidence_type VARCHAR(50),
    evidence_url VARCHAR(255),
    determined_by VARCHAR(50),
    verified_by VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'PENDING',
    activity_snapshot JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
