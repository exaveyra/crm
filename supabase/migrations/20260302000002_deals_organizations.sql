-- ============================================
-- DEALS TABLE
-- ============================================
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Relationships
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  assigned_to     UUID REFERENCES auth.users(id),

  -- Deal details
  title       TEXT NOT NULL,
  description TEXT,
  stage       TEXT CHECK (stage IN (
    'prospecting','qualification','proposal',
    'negotiation','closed_won','closed_lost'
  )) DEFAULT 'prospecting' NOT NULL,

  -- Financials
  value        DECIMAL(12,2),
  probability  INTEGER DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  currency     TEXT DEFAULT 'USD',

  -- Timeline
  expected_close_date DATE,
  actual_close_date   DATE,

  -- Products of interest
  products_interest TEXT[] DEFAULT '{}',

  -- Meta
  lost_reason TEXT,
  notes       TEXT,
  tags        TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}'
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_deals_updated_at();

-- Indexes
CREATE INDEX deals_contact_idx      ON deals(contact_id);
CREATE INDEX deals_org_idx          ON deals(organization_id);
CREATE INDEX deals_stage_idx        ON deals(stage);
CREATE INDEX deals_close_date_idx   ON deals(expected_close_date);
CREATE INDEX deals_assigned_idx     ON deals(assigned_to);

-- Add foreign key from activities to deals
ALTER TABLE activities
  ADD CONSTRAINT activities_deal_id_fkey
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL;

-- ============================================
-- RLS for deals
-- ============================================
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access_deals" ON deals
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Update organizations: add updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_organizations_updated_at();
