-- Fish Tournament App Database Schema
-- PostgreSQL with PostGIS for geospatial queries

-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    region VARCHAR(100),
    favorite_species TEXT[],
    verified_angler BOOLEAN DEFAULT FALSE,
    fraud_score INTEGER DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
    device_fingerprint TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User devices (for fraud detection)
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_id)
);

-- Tournaments table
CREATE TABLE tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    species TEXT[] NOT NULL,
    region_boundaries GEOGRAPHY(POLYGON, 4326), -- PostGIS geography type
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    entry_fee DECIMAL(10, 2) DEFAULT 0.00,
    prize_structure JSONB DEFAULT '{"1st": 70, "2nd": 20, "3rd": 10}',
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'active', 'closed', 'finalized')),
    created_by UUID REFERENCES users(id),
    is_user_created BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament participants
CREATE TABLE tournament_participants (
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_transaction_id VARCHAR(255),
    PRIMARY KEY (tournament_id, user_id)
);

-- Catch sessions (for verification codes)
CREATE TABLE catch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    verification_code VARCHAR(10) NOT NULL,
    gps_start GEOGRAPHY(POINT, 4326),
    timestamp_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for finding active sessions
CREATE INDEX idx_sessions_status ON catch_sessions(status, expires_at);

-- Catches table
CREATE TABLE catches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    session_id UUID REFERENCES catch_sessions(id),
    photo_url TEXT NOT NULL,
    video_url TEXT,
    gps_capture GEOGRAPHY(POINT, 4326) NOT NULL,
    timestamp_capture TIMESTAMP NOT NULL,
    species VARCHAR(100),
    length_inches DECIMAL(5, 2), -- e.g., 23.75
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'under_review')),
    cv_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    fraud_signals JSONB DEFAULT '{}',
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX idx_catches_tournament ON catches(tournament_id);
CREATE INDEX idx_catches_user ON catches(user_id);
CREATE INDEX idx_catches_status ON catches(status);
CREATE INDEX idx_catches_length ON catches(length_inches DESC);

-- Payment methods table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', 'apple_pay', etc.
    last4 VARCHAR(4),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('entry_fee', 'payout', 'wallet_deposit', 'wallet_withdrawal')),
    amount DECIMAL(10, 2) NOT NULL,
    stripe_transaction_id VARCHAR(255),
    tournament_id UUID REFERENCES tournaments(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image hashes for duplicate detection
CREATE TABLE image_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catch_id UUID REFERENCES catches(id) ON DELETE CASCADE,
    phash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast similarity searches
CREATE INDEX idx_image_hashes_phash ON image_hashes(phash);

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'reviewer' CHECK (role IN ('reviewer', 'senior_admin', 'super_admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bans table
CREATE TABLE bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    ban_type VARCHAR(20) CHECK (ban_type IN ('temporary', 'permanent')),
    banned_by UUID REFERENCES admin_users(id),
    expires_at TIMESTAMP, -- NULL for permanent bans
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_catches_updated_at BEFORE UPDATE ON catches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing

-- Insert sample admin user (password: admin123)
INSERT INTO admin_users (email, password_hash, role) VALUES
('admin@fishtourney.com', '$2b$10$YourHashHere', 'super_admin');

-- Insert sample tournament (Tampa Bay Snook)
INSERT INTO tournaments (name, species, region_boundaries, start_time, end_time, entry_fee) VALUES
(
    'Biggest Snook Today - Tampa Bay',
    ARRAY['Snook'],
    ST_GeogFromText('POLYGON((-82.6 27.8, -82.4 27.8, -82.4 28.0, -82.6 28.0, -82.6 27.8))'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '12 hours',
    0.00 -- Free for testing
);

COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE tournaments IS 'Tournament definitions and configurations';
COMMENT ON TABLE catches IS 'Fish catch submissions from users';
COMMENT ON TABLE catch_sessions IS 'Temporary sessions for catch verification codes';
COMMENT ON COLUMN catches.fraud_signals IS 'JSON object containing fraud detection scores and flags';
COMMENT ON COLUMN tournaments.region_boundaries IS 'Geographic polygon defining tournament boundaries (PostGIS)';
