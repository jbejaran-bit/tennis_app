-- Create racquet_configs table
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS racquet_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES auth.users(id) ON DELETE CASCADE,
  config_name text,
  base_specs jsonb,
  modifications jsonb,
  created_at timestamptz DEFAULT now()
);

-- Optional index for quick lookup
CREATE INDEX IF NOT EXISTS idx_racquet_configs_user ON racquet_configs (user_id);
