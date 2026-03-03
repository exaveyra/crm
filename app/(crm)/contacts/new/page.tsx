'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

export default function NewContactPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [npiChecking, setNpiChecking] = useState(false);
  const [npiResult, setNpiResult] = useState<any>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    contact_type: 'prospect',
    specialty: '',
    practice_name: '',
    practice_type: '',
    num_providers: '',
    npi_number: '',
    dea_number: '',
    address_line1: '',
    city: '',
    state: 'FL',
    zip: '',
    lead_source: '',
    lead_status: 'new',
    estimated_monthly_value: '',
    notes: '',
    tags: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function verifyNPI() {
    if (!form.npi_number || form.npi_number.length !== 10) {
      setNpiResult({ error: 'NPI must be 10 digits' });
      return;
    }
    setNpiChecking(true);
    setNpiResult(null);
    try {
      const res = await fetch(
        `https://npiregistry.cms.hhs.gov/api/?number=${form.npi_number}&version=2.1`
      );
      const data = await res.json();
      if (data.result_count === 0) {
        setNpiResult({ error: 'NPI not found in registry' });
      } else {
        const p = data.results[0];
        setNpiResult({
          valid: true,
          name: `${p.basic.first_name} ${p.basic.last_name}`,
          credential: p.basic.credential,
          specialty: p.taxonomies?.[0]?.desc,
          state: p.addresses?.[0]?.state,
          status: p.basic.status
        });
        // Auto-fill specialty if empty
        if (!form.specialty && p.taxonomies?.[0]?.desc) {
          setForm(prev => ({ ...prev, specialty: p.taxonomies[0].desc }));
        }
      }
    } catch {
      setNpiResult({ error: 'NPI lookup failed — check connection' });
    }
    setNpiChecking(false);
  }

  async function handleSubmit() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload: any = {
      ...form,
      num_providers: form.num_providers ? parseInt(form.num_providers) : null,
      estimated_monthly_value: form.estimated_monthly_value ? parseFloat(form.estimated_monthly_value) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      npi_verified: npiResult?.valid === true,
      npi_verified_at: npiResult?.valid === true ? new Date().toISOString() : null,
      lead_score: 0,
      actual_lifetime_value: 0,
      hipaa_consent: false,
      dnc_flag: false,
      state_compliance_verified: false,
      custom_fields: {},
      country: 'US',
    };

    // Clean empty strings to null
    Object.keys(payload).forEach(k => {
      if (payload[k] === '') payload[k] = null;
    });

    const { data, error: insertError } = await supabase
      .from('contacts')
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push(`/contacts/${data.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/contacts')}
          className="text-gray-500 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Add Contact</h1>
          <p className="text-gray-500 text-sm mt-0.5">Add a new practitioner, lead, or patient</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Section: Basic Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">First Name *</label>
            <input name="first_name" value={form.first_name} onChange={handleChange}
              placeholder="Dr. Maria"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Last Name *</label>
            <input name="last_name" value={form.last_name} onChange={handleChange}
              placeholder="Rodriguez"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="doctor@clinic.com"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              placeholder="(305) 555-0100"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Contact Type</label>
            <select name="contact_type" value={form.contact_type} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="prospect">Prospect</option>
              <option value="prescriber">Prescriber</option>
              <option value="regenerative_md">Regenerative MD</option>
              <option value="aesthetics_md">Aesthetics MD</option>
              <option value="clinic_admin">Clinic Admin</option>
              <option value="patient">Patient</option>
              <option value="vendor">Vendor</option>
              <option value="referral_partner">Referral Partner</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Lead Status</label>
            <select name="lead_status" value={form.lead_status} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed_won">Closed Won</option>
              <option value="nurture">Nurture</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Lead Source</label>
            <select name="lead_source" value={form.lead_source} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select source</option>
              <option value="website_form">Website Form</option>
              <option value="referral">Referral</option>
              <option value="cold_outreach">Cold Outreach</option>
              <option value="conference">Conference</option>
              <option value="linkedin">LinkedIn</option>
              <option value="google_ads">Google Ads</option>
              <option value="organic_search">Organic Search</option>
              <option value="email_campaign">Email Campaign</option>
              <option value="existing_customer">Existing Customer</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Est. Monthly Value ($)</label>
            <input name="estimated_monthly_value" type="number" value={form.estimated_monthly_value} onChange={handleChange}
              placeholder="5000"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {/* Section: Practice Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Practice Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Practice Name</label>
            <input name="practice_name" value={form.practice_name} onChange={handleChange}
              placeholder="South Florida Wellness Center"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Practice Type</label>
            <select name="practice_type" value={form.practice_type} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select type</option>
              <option value="solo_practice">Solo Practice</option>
              <option value="group_practice">Group Practice</option>
              <option value="medspa">Med Spa</option>
              <option value="hospital">Hospital</option>
              <option value="wellness_center">Wellness Center</option>
              <option value="functional_medicine">Functional Medicine</option>
              <option value="anti_aging">Anti-Aging</option>
              <option value="orthopedics">Orthopedics</option>
              <option value="sports_medicine">Sports Medicine</option>
              <option value="urgent_care">Urgent Care</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Specialty</label>
            <input name="specialty" value={form.specialty} onChange={handleChange}
              placeholder="Functional Medicine"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Number of Providers</label>
            <input name="num_providers" type="number" value={form.num_providers} onChange={handleChange}
              placeholder="3"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1.5 block">City</label>
            <input name="city" value={form.city} onChange={handleChange}
              placeholder="Miami"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">State</label>
            <select name="state" value={form.state} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section: NPI Verification */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Credentials & Compliance</h2>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">NPI Number</label>
          <div className="flex gap-3">
            <input name="npi_number" value={form.npi_number} onChange={handleChange}
              placeholder="10-digit NPI"
              maxLength={10}
              className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button
              onClick={verifyNPI}
              disabled={npiChecking || form.npi_number.length !== 10}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {npiChecking ? 'Checking...' : 'Verify NPI'}
            </button>
          </div>

          {/* NPI Result */}
          {npiResult && (
            <div className={`mt-3 px-4 py-3 rounded-lg text-sm ${npiResult.valid ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {npiResult.valid ? (
                <div className="space-y-1">
                  <p className="font-medium">✓ NPI Verified — {npiResult.name} {npiResult.credential}</p>
                  <p className="text-xs opacity-80">{npiResult.specialty} · Licensed in {npiResult.state} · Status: {npiResult.status === 'A' ? 'Active' : npiResult.status}</p>
                </div>
              ) : (
                <p>✗ {npiResult.error}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">DEA Number</label>
          <input name="dea_number" value={form.dea_number} onChange={handleChange}
            placeholder="For 503A controlled substance discussions"
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Section: Tags & Notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Tags & Notes</h2>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Tags <span className="text-gray-600">(comma separated)</span></label>
          <input name="tags" value={form.tags} onChange={handleChange}
            placeholder="exosome_interest, 503a_interest, high_value"
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="Any relevant context about this contact..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pb-8">
        <button
          onClick={() => router.push('/contacts')}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Create Contact'}
        </button>
      </div>
    </div>
  );
}