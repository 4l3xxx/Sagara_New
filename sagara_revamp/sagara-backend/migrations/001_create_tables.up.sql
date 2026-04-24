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
