-- Migration 013: Push Tokens and Topic Subscriptions
-- Manages FCM tokens and topic subscriptions for notification delivery

BEGIN;

-- User push tokens (FCM tokens from mobile devices)
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Token information
  fcm_token TEXT NOT NULL,
  platform VARCHAR(20),              -- 'ios', 'android', 'web'
  device_id TEXT,                    -- Device identifier
  device_name TEXT,                  -- e.g., "iPhone 13 Pro", "Samsung Galaxy S22"
  
  -- Status
  active BOOLEAN DEFAULT true,       -- false = token expired/invalid
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint: one user can have same token only once
  UNIQUE(user_id, fcm_token)
);

-- Indexes
CREATE INDEX idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_active ON user_push_tokens(active) WHERE active = true;
CREATE INDEX idx_user_push_tokens_fcm_token ON user_push_tokens(fcm_token);

-- Index for quickly finding all active tokens for a user
CREATE INDEX idx_user_push_tokens_user_active ON user_push_tokens(user_id, updated_at DESC) 
  WHERE active = true;

COMMENT ON TABLE user_push_tokens IS 'Stores FCM tokens for push notification delivery';
COMMENT ON COLUMN user_push_tokens.fcm_token IS 'Firebase Cloud Messaging token';
COMMENT ON COLUMN user_push_tokens.platform IS 'Device platform (ios/android/web)';
COMMENT ON COLUMN user_push_tokens.active IS 'false when token is expired or user logged out';

-- Topic subscriptions (for tracking and analytics)
CREATE TABLE IF NOT EXISTS topic_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Topic information
  topic VARCHAR(255) NOT NULL,       -- e.g., 'doctors_all', 'pharmacists_region_paris'
  
  -- Timestamps
  subscribed_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP,
  
  -- Unique constraint: user can subscribe to same topic only once
  UNIQUE(user_id, topic)
);

-- Indexes
CREATE INDEX idx_topic_subscriptions_user_id ON topic_subscriptions(user_id);
CREATE INDEX idx_topic_subscriptions_topic ON topic_subscriptions(topic);
CREATE INDEX idx_topic_subscriptions_subscribed_at ON topic_subscriptions(subscribed_at DESC);

-- Index for active subscriptions
CREATE INDEX idx_topic_subscriptions_active ON topic_subscriptions(user_id, topic) 
  WHERE unsubscribed_at IS NULL;

COMMENT ON TABLE topic_subscriptions IS 'Tracks user subscriptions to Firebase topics';
COMMENT ON COLUMN topic_subscriptions.topic IS 'Firebase topic name (e.g., doctors_all, patients_diabetes)';
COMMENT ON COLUMN topic_subscriptions.unsubscribed_at IS 'NULL if still subscribed, timestamp if unsubscribed';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_push_tokens
CREATE TRIGGER update_user_push_tokens_updated_at
  BEFORE UPDATE ON user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for notifications
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
