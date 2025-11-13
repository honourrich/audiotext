-- Database Schema for ShowNote AI with Clerk Integration

-- Users table - stores Clerk user data and subscription info
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk user ID
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  stripe_customer_id VARCHAR(255), -- Links to Stripe customer
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL DEFAULT 'free', -- free, starter, pro, unlimited
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, canceled, past_due
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Episodes table - stores user's podcast/video episodes
CREATE TABLE episodes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  source_type VARCHAR(20) NOT NULL, -- 'file' or 'youtube'
  audio_url TEXT, -- For uploaded files
  youtube_url TEXT, -- For YouTube videos
  duration INTEGER, -- Duration in seconds
  file_size BIGINT, -- File size in bytes
  status VARCHAR(20) DEFAULT 'processing', -- processing, completed, error
  progress INTEGER DEFAULT 0, -- Processing progress 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Episode content - stores AI-generated content
CREATE TABLE episode_content (
  id SERIAL PRIMARY KEY,
  episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  transcript TEXT,
  summary TEXT,
  keywords TEXT[], -- Array of keywords
  chapters JSONB, -- JSON array of chapter objects
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage tracking for subscription limits
CREATE TABLE usage_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'episode_created', 'transcription', etc.
  credits_used INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_episodes_user_id ON episodes(user_id);
CREATE INDEX idx_episodes_status ON episodes(status);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);

-- Sample data
INSERT INTO users (clerk_id, email, first_name, last_name, stripe_customer_id) VALUES
('user_2abc123def456', 'john@example.com', 'John', 'Doe', 'cus_stripe123'),
('user_2xyz789ghi012', 'sarah@example.com', 'Sarah', 'Chen', 'cus_stripe456');

INSERT INTO subscriptions (user_id, plan, status) VALUES
(1, 'pro', 'active'),
(2, 'starter', 'active');

INSERT INTO episodes (user_id, title, source_type, youtube_url, duration, status) VALUES
(1, 'The Future of AI in Content Creation', 'youtube', 'https://youtube.com/watch?v=example1', 2732, 'completed'),
(1, 'Podcast Marketing Strategies', 'file', NULL, 1938, 'completed'),
(2, 'Building a Creator Economy', 'youtube', 'https://youtube.com/watch?v=example2', 1725, 'processing');