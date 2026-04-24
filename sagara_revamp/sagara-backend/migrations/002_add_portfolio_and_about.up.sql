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
