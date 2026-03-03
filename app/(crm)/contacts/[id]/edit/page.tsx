'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

export default function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    medical_license: '',
    address_line1: '',
    city: '',
    state: 'FL',
    zip: '',
    lead_source: '',
    lead_status: 'new',
    lead_score: '',
    estimated_monthly_value: '',
    hipaa_consent: false,
    npi_verified: false,
    dnc_flag: false,
    tags: '',
    notes: '',
    next_follow_up_at: '',
  });

  useEffect(() => {
    loadContact();
  }, [id]);

  async function loadContact() {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      setError('Contact not found.');
      setLoading(false);
      return;
    }

    setForm({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      mobile: data.mobile || '',
      contact_type: data.contact_type || 'prospect',
      specialty: data.specialty || '',
      practice_name: data.practice_name || '',
      practice_type: data.practice_type || '',
      num_providers: data.num_providers?.toString() || '',
      npi_number: data.npi_number || '',
      dea_number: data.dea_number || '',
      medical_license: data.medical_license || '',
      address_line1: data.address_line1 || '',
      city: data.city || '',
      state: data.state || 'FL',
      zip: data.zip || '',
      lead_source: data.lead_source || '',
      lead_status: data.lead_status || 'new',
      lead_score: data.lead_score?.toString() || '0',
      estimated_monthly_value: data.estimated_monthly_value?.toString() || '',
      hipaa_consent: data.hipaa_consent || false,
      npi_verified: data.npi_verified || false,
      dnc_flag: data.dnc_flag || false,
      tags: data.tags?.join(', ') || '',
      notes: data.notes || '',
      next_follow_up_at: data.next_follow_up_at
        ? new Date(data.next_follow_up_at).toISOString().split('T')[0]
        : '',
    });
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = e.target;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setForm(prev => ({ ...prev, [target.name]: value }));
  }

  async function handleSubmit() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess(false);

    const payload: any = {
      ...form,
      num_providers: form.num_providers ? parseInt(form.num_providers) : null,
      estimated_monthly_value: form.estimated_monthly_value ? parseFloat(form.estimated_monthly_value) : null,
      lead_score: form.lead_score ? parseInt(form.lead_score) : 0,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      next_follow_up_at: form.next_follow_up_at || null,
      updated_at: new Date().toISOString(),
    };

    // Clean empty strings to null
    Object.keys(payload).forEach(k => {
      if (payload[k] === '') payload[k] = null;
    });

    const { error: updateError } = await supabase
      .from('contacts')
      .update(payload)
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => router.push(`/contacts/${id}`), 1000);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this contact? This cannot be undone.')) return;
    await supabase.from('contacts').delete().eq('id', id);
    router.push('/contacts');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading contact...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/contacts/${id}`)}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">Edit Contact</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {form.first_name} {form.last_name}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
        >
          🗑 Delete Contact
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-lg">
          ✓ Contact updated successfully — redirecting...
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Basic Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">First Name *</label>
            <input name="first_name" value={form.first_name} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Last Name *</label>
            <input name="last_name" value={form.last_name} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Mobile</label>
            <input name="mobile" value={form.mobile} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Next Follow-up Date</label>
            <input name="next_follow_up_at" type="date" value={form.next_follow_up_at} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {/* Lead Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Lead Classification</h2>

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
              <option value="closed_lost">Closed Lost</option>
              <option value="nurture">Nurture</option>
              <option value="do_not_contact">Do Not Contact</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Lead Score (0–100)</label>
            <input name="lead_score" type="number" min="0" max="100" value={form.lead_score} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Est. Monthly Value ($)</label>
            <input name="estimated_monthly_value" type="number" value={form.estimated_monthly_value} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
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
        </div>
      </div>

      {/* Practice Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Practice Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Practice Name</label>
            <input name="practice_name" value={form.practice_name} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Number of Providers</label>
            <input name="num_providers" type="number" value={form.num_providers} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1.5 block">Address</label>
            <input name="address_line1" value={form.address_line1} onChange={handleChange}
              placeholder="123 Main St"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">ZIP</label>
            <input name="zip" value={form.zip} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1.5 block">City</label>
            <input name="city" value={form.city} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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

      {/* Credentials */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">Credentials & Compliance</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">NPI Number</label>
            <input name="npi_number" value={form.npi_number} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white font-mono rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">DEA Number</label>
            <input name="dea_number" value={form.dea_number} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white font-mono rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Medical License #</label>
            <input name="medical_license" value={form.medical_license} onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white font-mono rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Compliance Toggles */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          {[
            { name: 'npi_verified', label: 'NPI Verified', color: 'indigo' },
            { name: 'hipaa_consent', label: 'HIPAA Consent Obtained', color: 'emerald' },
            { name: 'dnc_flag', label: 'Do Not Contact', color: 'red' },
          ].map(({ name, label, color }) => (
            <label key={name} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name={name}
                  checked={form[name as keyof typeof form] as boolean}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors ${
                  form[name as keyof typeof form]
                    ? color === 'red' ? 'bg-red-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-500'
                    : 'bg-gray-700'
                }`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form[name as keyof typeof form] ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags & Notes */}
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
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pb-8">
        <button
          onClick={() => router.push(`/contacts/${id}`)}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}