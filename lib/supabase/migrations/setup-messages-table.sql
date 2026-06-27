-- Create messages table for storing all incoming messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Message source
  channel VARCHAR NOT NULL CHECK (channel IN ('whatsapp', 'messenger', 'email', 'instagram')),
  external_id VARCHAR UNIQUE, -- Unique ID from the messaging provider
  direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Sender information
  sender_phone VARCHAR, -- For WhatsApp
  sender_id VARCHAR, -- For Messenger/Instagram
  sender_email VARCHAR, -- For email

  -- Message content
  content TEXT,
  subject VARCHAR, -- For email

  -- Metadata
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agency_users(id) ON DELETE SET NULL,

  -- Tracking
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Raw data for debugging/re-processing
  raw_data JSONB,

  -- Status tracking
  status VARCHAR DEFAULT 'received' CHECK (status IN ('received', 'processed', 'replied', 'archived')),
  processed_at TIMESTAMP,

  INDEX idx_messages_agency_id (agency_id),
  INDEX idx_messages_channel (channel),
  INDEX idx_messages_timestamp (timestamp),
  INDEX idx_messages_external_id (external_id),
  INDEX idx_messages_status (status)
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see messages for their agency
CREATE POLICY "Users can view their agency messages"
  ON messages FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_users
      WHERE id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Create index for message recovery
CREATE INDEX idx_messages_unprocessed ON messages(status) WHERE status != 'archived';
