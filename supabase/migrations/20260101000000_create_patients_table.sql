-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  history TEXT NOT NULL DEFAULT '',
  symptoms TEXT NOT NULL DEFAULT '',
  tests TEXT NOT NULL DEFAULT '',
  allergies TEXT NOT NULL DEFAULT '',
  possible_condition TEXT DEFAULT '',
  recommendations TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS patients_created_at_idx ON patients(created_at DESC);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations for authenticated users" 
  ON patients 
  FOR ALL 
  USING (true)
  WITH CHECK (true);
