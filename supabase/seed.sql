-- Sample data for development/testing
-- Remove before production deployment

INSERT INTO contacts (
  first_name, last_name, email, phone,
  contact_type, specialty, practice_name, practice_type,
  city, state, lead_source, lead_status, lead_score,
  estimated_monthly_value, npi_number, npi_verified,
  tags
) VALUES
(
  'Dr. Maria', 'Rodriguez', 'mrodriguez@southfloridawellness.com', '(305) 555-0142',
  'regenerative_md', 'functional_medicine', 'South Florida Wellness Center', 'functional_medicine',
  'Miami', 'FL', 'referral', 'qualified', 72,
  4500.00, '1234567890', TRUE,
  ARRAY['exosome_interest', 'peptide_interest', 'high_value']
),
(
  'Dr. James', 'Thornton', 'jthorn@miamiorthosports.com', '(305) 555-0198',
  'prescriber', 'orthopedics', 'Miami Ortho & Sports Medicine', 'group_practice',
  'Coral Gables', 'FL', 'website_form', 'contacted', 55,
  8000.00, '9876543210', TRUE,
  ARRAY['503a_interest', 'device_interest']
),
(
  'Sarah', 'Chen', 'schen@brickellmedspa.com', '(305)