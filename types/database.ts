export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ContactType =
  | 'prescriber'
  | 'clinic_admin'
  | 'regenerative_md'
  | 'aesthetics_md'
  | 'patient'
  | 'prospect'
  | 'vendor'
  | 'referral_partner'

export type PracticeType =
  | 'solo_practice'
  | 'group_practice'
  | 'medspa'
  | 'hospital'
  | 'wellness_center'
  | 'functional_medicine'
  | 'anti_aging'
  | 'orthopedics'
  | 'sports_medicine'
  | 'urgent_care'
  | 'other'

export type LeadSource =
  | 'website_form'
  | 'referral'
  | 'cold_outreach'
  | 'conference'
  | 'linkedin'
  | 'google_ads'
  | 'organic_search'
  | 'email_campaign'
  | 'existing_customer'
  | 'exaveyra_concierge'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'nurture'
  | 'do_not_contact'

export type ActivityType =
  | 'call'
  | 'email_sent'
  | 'email_received'
  | 'meeting'
  | 'demo'
  | 'proposal_sent'
  | 'contract_sent'
  | 'note'
  | 'sms_sent'
  | 'sms_received'
  | 'follow_up'
  | 'sample_sent'
  | 'stage_change'
  | 'npi_verification'

export interface Contact {
  id: string
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  mobile: string | null
  contact_type: ContactType | null
  npi_number: string | null
  dea_number: string | null
  medical_license: string | null
  license_states: string[] | null
  specialty: string | null
  practice_name: string | null
  practice_type: PracticeType | null
  num_providers: number | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  lead_source: LeadSource | null
  lead_score: number | null
  lead_status: LeadStatus | null
  hipaa_consent: boolean | null
  hipaa_consent_date: string | null
  dnc_flag: boolean | null
  npi_verified: boolean | null
  npi_verified_at: string | null
  state_compliance_verified: boolean | null
  estimated_monthly_value: number | null
  actual_lifetime_value: number | null
  tags: string[] | null
  assigned_to: string | null
  last_contacted_at: string | null
  next_follow_up_at: string | null
  notes: string | null
  custom_fields: Json | null
  search_vector?: unknown
}

export type ContactInsert = Omit<Contact,
  'id' | 'created_at' | 'updated_at' | 'search_vector'
>

export type ContactUpdate = Partial<ContactInsert>

export interface Organization {
  id: string
  created_at: string
  updated_at: string
  name: string
  type: string | null
  website: string | null
  phone: string | null
  email: string | null
  address_line1: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  annual_revenue_estimate: number | null
  num_providers: number | null
  buying_group: string | null
  tags: string[] | null
  notes: string | null
  custom_fields: Json | null
}

export interface Activity {
  id: string
  created_at: string
  contact_id: string | null
  deal_id: string | null
  created_by: string | null
  type: ActivityType
  subject: string | null
  body: string | null
  duration_minutes: number | null
  outcome: string | null
  gmail_message_id: string | null
  gmail_thread_id: string | null
  metadata: Json | null
}

export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'

export interface Deal {
  id: string
  created_at: string
  updated_at: string
  contact_id: string | null
  organization_id: string | null
  assigned_to: string | null
  title: string
  description: string | null
  stage: DealStage
  value: number | null
  probability: number | null
  currency: string | null
  expected_close_date: string | null
  actual_close_date: string | null
  products_interest: string[] | null
  lost_reason: string | null
  notes: string | null
  tags: string[] | null
  custom_fields: Json | null
}

export type DealInsert = Omit<Deal, 'id' | 'created_at' | 'updated_at'>
export type DealUpdate = Partial<DealInsert>

export interface LeadEvent {
  id: string
  created_at: string
  contact_id: string | null
  event_type: string
  score_delta: number
  metadata: Json | null
}

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: Contact
        Insert: ContactInsert
        Update: ContactUpdate
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>
      }
      activities: {
        Row: Activity
        Insert: Omit<Activity, 'id' | 'created_at'>
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>
      }
      lead_events: {
        Row: LeadEvent
        Insert: Omit<LeadEvent, 'id' | 'created_at'>
        Update: Partial<Omit<LeadEvent, 'id' | 'created_at'>>
      }
      deals: {
        Row: Deal
        Insert: DealInsert
        Update: DealUpdate
      }
    }
  }
}
