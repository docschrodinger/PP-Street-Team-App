-- Quick check to see what columns exist in street_venue_leads
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'street_venue_leads'
ORDER BY ordinal_position;
