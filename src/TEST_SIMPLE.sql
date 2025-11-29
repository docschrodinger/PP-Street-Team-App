-- Simple test - just add one column
ALTER TABLE street_venue_leads
  ADD COLUMN IF NOT EXISTS website_inquiry_id UUID;

-- Verify it worked
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'street_venue_leads'
  AND column_name = 'website_inquiry_id';
