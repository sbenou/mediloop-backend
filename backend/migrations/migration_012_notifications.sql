-- Migration 012: Notification System
-- Creates tables for storing notification history and managing delivery

BEGIN;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255),
  
  -- Notification content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  image_url TEXT,
  
  -- Delivery metadata
  channels TEXT[],                   -- ['fcm', 'websocket', 'database']
  topic VARCHAR(255),                -- If sent to topic (broadcast)
  priority VARCHAR(20) DEFAULT 'default', -- 'high', 'default', 'low'
  actions JSONB,                     -- Action buttons [{"id": "accept", "title": "Accept"}]
  
  -- Status tracking
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  clicked_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);
CREATE INDEX idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_topic ON notifications(topic) WHERE topic IS NOT NULL;
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Index for fetching unread notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, sent_at DESC) 
  WHERE read_at IS NULL;

COMMENT ON TABLE notifications IS 'Stores notification history for all users';
COMMENT ON COLUMN notifications.user_id IS 'User who received notification (NULL for topic broadcasts)';
COMMENT ON COLUMN notifications.tenant_id IS 'Tenant ID for multi-tenancy (optional)';
COMMENT ON COLUMN notifications.channels IS 'Delivery channels used (FCM, WebSocket, database)';
COMMENT ON COLUMN notifications.topic IS 'Firebase topic if broadcast notification';
COMMENT ON COLUMN notifications.actions IS 'Action buttons shown in notification';
COMMENT ON COLUMN notifications.read_at IS 'When user viewed notification in app';
COMMENT ON COLUMN notifications.clicked_at IS 'When user clicked/tapped notification';

COMMIT;
