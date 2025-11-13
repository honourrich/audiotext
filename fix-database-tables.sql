-- Fix missing database tables for usage tracking
-- Run this in your Supabase SQL Editor

-- Create user usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- format: 'YYYY-MM'
  episodes_processed INTEGER DEFAULT 0,
  total_minutes_processed INTEGER DEFAULT 0,
  gpt_prompts_used INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  max_episodes_per_month INTEGER,
  max_minutes_per_episode INTEGER,
  priority_processing BOOLEAN DEFAULT FALSE,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert subscription plans
INSERT INTO subscription_plans (name, price_monthly, price_yearly, max_episodes_per_month, max_minutes_per_episode, priority_processing, features) VALUES
('Free', 0.00, 0.00, -1, 30, FALSE, '{"export_formats": ["txt"], "support": "community", "max_gpt_prompts": 5}'),
('Pro', 19.99, 199.99, -1, -1, TRUE, '{"export_formats": ["txt", "pdf", "docx"], "support": "email", "advanced_editing": true, "max_gpt_prompts": -1}')
ON CONFLICT DO NOTHING;

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read access to subscription plans
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_plans;
