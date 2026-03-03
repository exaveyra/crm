-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Identity
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  mobile     TEXT,

  -- Contact classification
  contact_type TEXT CHECK (contact_type IN (
    'prescriber',
    'clinic_admin',
    'regenerative_md',
    'aesthetics_md',
    'patient',
    'prospect',
    'vendor',
    'referral_partner'
  )) DEFAULT 'prospect',

  -- Professional credentials
  npi_number      TEXT,
  dea_number      TEXT,
  medical_license TEXT,
  license_states  TEXT[],
  specialty       TEXT,
  practice_name   TEXT,
  practice_type   TEXT CHECK (practice_type IN (
    'solo_practice','group_practice','medspa','hospital',
    'wellness_center','functional_medicine','anti_aging',
    'orthopedics','sports_medicine','urgent_care','other'
  )),
  num_providers   INTEGER,

  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  country       TEXT DEFAULT 'US',

  -- Lead intelligence
  lead_source TEXT CHECK (lead_source IN (
    'website_form','referral','cold_outreach','conference',
    'linkedin','google_ads','organic_search','email_campaign',
    'existing_customer','exaveyra_concierge'
  )),
  lead_score  INTEGER DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  lead_status TEXT CHECK (lead_status IN (
    'new','contacted','qualified','proposal',
    'negotiation','closed_won','closed_lost',
    'nurture','do_not_contact'
  )) DEFAULT 'new',

  -- Compliance flags
  hipaa_consent             BOOLEAN DEFAULT FALSE,
  hipaa_consent_date        TIMESTAMPTZ,
  dnc_flag                  BOOLEAN DEFAULT FALSE,
  npi_verified              BOOLEAN DEFAULT FALSE,
  npi_verified_at           TIMESTAMPTZ,
  state_compliance_verified BOOLEAN DEFAULT FALSE,

  -- Revenue tracking
  estimated_monthly_value DECIMAL(10,2),
  actual_lifetime_value   DECIMAL(10,2) DEFAULT 0,

  -- Operational
  tags              TEXT[] DEFAULT '{}',
  assigned_to       UUID REFERENCES auth.users(id),
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  notes             TEXT,
  custom_fields     JSONB DEFAULT '{}',

  -- Search vector (full-text search)
  search_vector TSVECTOR
);

-- Full text search index
CREATE INDEX contacts_search_idx ON contacts USING GIN(search_vector);
CREATE INDEX contacts_email_idx ON contacts(email);
CREATE INDEX contacts_type_idx ON contacts(contact_type);
CREATE INDEX contacts_status_idx ON contacts(lead_status);
CREATE INDEX contacts_follow_up_idx ON contacts(next_follow_up_at);
CREATE INDEX contacts_assigned_idx ON contacts(assigned_to);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_contact_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      COALESCE(NEW.first_name, '') || ' ' ||
      COALESCE(NEW.last_name, '') || ' ' ||
      COALESCE(NEW.email, '') || ' ' ||
      COALESCE(NEW.practice_name, '') || ' ' ||
      COALESCE(NEW.specialty, '') || ' ' ||
      COALESCE(NEW.npi_number, '') || ' ' ||
      COALESCE(NEW.city, '') || ' ' ||
      COALESCE(NEW.state, '')
    );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_search_update
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_contact_search_vector();

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  name         TEXT NOT NULL,
  type         TEXT,
  website      TEXT,
  phone        TEXT,
  email        TEXT,
  address_line1 TEXT,
  city         TEXT,
  state        TEXT,
  zip          TEXT,
  country      TEXT DEFAULT 'US',

  annual_revenue_estimate DECIMAL(12,2),
  num_providers           INTEGER,
  buying_group            TEXT,

  tags   TEXT[] DEFAULT '{}',
  notes  TEXT,
  custom_fields JSONB DEFAULT '{}'
);

CREATE INDEX organizations_name_idx ON organizations(name);

-- ============================================
-- CONTACT <-> ORGANIZATION (many-to-many)
-- ============================================
CREATE TABLE contact_organizations (
  contact_id      UUID REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role            TEXT,
  is_primary      BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (contact_id, organization_id)
);

-- ============================================
-- ACTIVITIES (contact timeline)
-- ============================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id    UUID,  -- Will reference deals once that table exists
  created_by UUID REFERENCES auth.users(id),

  type TEXT CHECK (type IN (
    'call','email_sent','email_received','meeting',
    'demo','proposal_sent','contract_sent','note',
    'sms_sent','sms_received','follow_up','sample_sent',
    'stage_change','npi_verification'
  )) NOT NULL,

  subject          TEXT,
  body             TEXT,
  duration_minutes INTEGER,
  outcome          TEXT,

  -- Gmail threading
  gmail_message_id TEXT UNIQUE,
  gmail_thread_id  TEXT,

  metadata JSONB DEFAULT '{}'
);

CREATE INDEX activities_contact_idx ON activities(contact_id);
CREATE INDEX activities_created_idx ON activities(created_at DESC);
CREATE INDEX activities_type_idx ON activities(type);
CREATE INDEX activities_gmail_idx ON activities(gmail_message_id);

-- ============================================
-- LEAD SCORE EVENTS (audit trail)
-- ============================================
CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  contact_id  UUID REFERENCES contacts(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  score_delta INTEGER NOT NULL DEFAULT 0,
  metadata    JSONB DEFAULT '{}'
);

CREATE INDEX lead_events_contact_idx ON lead_events(contact_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_organizations ENABLE ROW LEVEL SECURITY;

-- For Sprint 1: authenticated users can access all records
-- (Tighten this in Sprint 6 with role-based policies)
CREATE POLICY "authenticated_full_access_contacts" ON contacts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_orgs" ON organizations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_activities" ON activities
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_lead_events" ON lead_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_full_access_contact_orgs" ON contact_organizations
  FOR ALL USING (auth.role() = 'authenticated');
