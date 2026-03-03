'use client';

import React from 'react';
import { useState, useEffect } from 'react';


import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  contact_type: string;
  specialty: string;
  practice_name: string;
  practice_type: string;
  num_providers: number;
  npi_number: string;
  dea_number: string;
  medical_license: string;
  license_states: string[];
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  lead_source: string;
  lead_score: number;
  lead_status: string;
  hipaa_consent: boolean;
  hipaa_consent_date: string;
  npi_verified: boolean;
  npi_verified_at: string;
  dnc_flag: boolean;
  estimated_monthly_value: number;
  actual_lifetime_value: number;
  tags: string[];
  notes: string;
  last_contacted_at: string;
  next_follow_up_at: string;
  created_at: string;
};

type Activity = {
  id: string;
  type: string;
  subject: string;
  body: string;
  outcome: string;
  duration_minutes: number;
  created_at: string;
  gmail_message_id: string;
};

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞',
  email_sent: '📤',
  email_received: '📥',
  meeting: '🤝',
  demo: '🖥',
  proposal_sent: '📄',
  contract_sent: '✍️',
  note: '📝',
  sms_sent: '💬',
  sample_sent: '📦',
  follow_up: '🔔',
  stage_change: '➡️',
};

const ACTIVITY_COLORS: Record<string, string> = {
  call: 'bg-blue-500/10 text-blue-400',
  email_sent: 'bg-indigo-500/10 text-indigo-400',
  email_received: 'bg-violet-500/10 text-violet-400',
  meeting: 'bg-emerald-500/10 text-emerald-400',
  demo: 'bg-cyan-500/10 text-cyan-400',
  proposal_sent: 'bg-amber-500/10 text-amber-400',
  contract_sent: 'bg-purple-500/10 text-purple-400',
  note: 'bg-gray-500/10 text-gray-400',
  sms_sent: 'bg-teal-500/10 text-teal-400',
  sample_sent: 'bg-orange-500/10 text-orange-400',
  follow_up: 'bg-pink-500/10 text-pink-400',
};

function formatCurrency(val?: number) {
  if (!val) return '—';
  return `$${val.toLocaleString()}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function formatRelative(dateStr?: string) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return formatDate(dateStr);
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-blue-500';
  const label = score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD';
  const textColor = score >= 70 ? 'text-emerald-400' : score >= 45 ? 'text-amber-400' : 'text-blue-400';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-2xl font-bold ${textColor}`}>{score}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${textColor} bg-current/10`}>{label}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);  
    const router = useRouter();
  const supabase = createClient();

  const [contact, setContact] = useState<Contact | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Log activity form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [actType, setActType] = useState('call');
  const [actSubject, setActSubject] = useState('');
  const [actBody, setActBody] = useState('');
  const [actOutcome, setActOutcome] = useState('');
  const [actDuration, setActDuration] = useState('');
  const [actFollowUp, setActFollowUp] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContact();
  }, [id]);

  async function loadContact() {
    setLoading(true);
    const [{ data: c }, { data: a }] = await Promise.all([
        supabase.from('contacts').select('*').eq('id', id).single(),
        supabase.from('activities').select('*').eq('contact_id', id)
        .order('created_at', { ascending: false }).limit(50)
    ]);
    setContact(c as Contact);
    setActivities((a as Activity[]) || []);
    setLoading(false);
  }

  async function logActivity() {
    if (!actBody.trim()) return;
    setSaving(true);

    await supabase.from('activities').insert({
        contact_id: id,
      type: actType,
      subject: actSubject || null,
      body: actBody,
      outcome: actOutcome || null,
      duration_minutes: actDuration ? parseInt(actDuration) : null,
      metadata: {}
    });

    // Update last_contacted_at
    const updates: any = { last_contacted_at: new Date().toISOString() };
    if (actFollowUp) updates.next_follow_up_at = actFollowUp;
    await supabase.from('contacts').update(updates).eq('id', params.id);

    setActType('call'); setActSubject(''); setActBody('');
    setActOutcome(''); setActDuration(''); setActFollowUp('');
    setShowLogForm(false);
    setSaving(false);
    loadContact();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading contact...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Contact not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/contacts')}
            className="text-gray-500 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">
              {contact.first_name?.[0]}{contact.last_name?.[0]}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-white">
                {contact.first_name} {contact.last_name}
              </h1>
              {contact.npi_verified && (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  ✓ NPI Verified
                </span>
              )}
              {contact.dnc_flag && (
                <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                  ⛔ DNC
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full capitalize">
                {contact.contact_type?.replace(/_/g, ' ')}
              </span>
              <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full capitalize">
                {contact.lead_status?.replace(/_/g, ' ')}
              </span>
              {contact.specialty && (
                <span className="text-sm text-gray-400">{contact.specialty}</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push(`/contacts/${contact.id}/edit`)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          ✏️ Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-5">

          {/* Lead Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Lead Intelligence</h3>
            <ScoreBar score={contact.lead_score} />
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Value</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(contact.estimated_monthly_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lifetime Value</span>
                <span className="text-white font-medium">{formatCurrency(contact.actual_lifetime_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lead Source</span>
                <span className="text-white capitalize">{contact.lead_source?.replace(/_/g, ' ') || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Added</span>
                <span className="text-white">{formatDate(contact.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-gray-300 hover:text-white group">
                  <span className="text-gray-600 group-hover:text-indigo-400">📧</span>
                  <span className="truncate">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-white group">
                  <span className="text-gray-600 group-hover:text-indigo-400">📞</span>
                  {contact.phone}
                </a>
              )}
              {contact.mobile && (
                <a href={`tel:${contact.mobile}`} className="flex items-center gap-3 text-gray-300 hover:text-white group">
                  <span className="text-gray-600 group-hover:text-indigo-400">📱</span>
                  {contact.mobile}
                </a>
              )}
              {contact.practice_name && (
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-gray-600">🏥</span>
                  {contact.practice_name}
                </div>
              )}
              {(contact.city || contact.state) && (
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-gray-600">📍</span>
                  {[contact.address_line1, contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Compliance */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Credentials & Compliance</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">NPI Number</span>
                <span className={`font-mono ${contact.npi_number ? 'text-white' : 'text-gray-700'}`}>
                  {contact.npi_number || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DEA Number</span>
                <span className={`font-mono ${contact.dea_number ? 'text-white' : 'text-gray-700'}`}>
                  {contact.dea_number || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">NPI Verified</span>
                <span className={contact.npi_verified ? 'text-emerald-400' : 'text-gray-600'}>
                  {contact.npi_verified ? `✓ ${formatDate(contact.npi_verified_at)}` : 'Not verified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">HIPAA Consent</span>
                <span className={contact.hipaa_consent ? 'text-emerald-400' : 'text-gray-600'}>
                  {contact.hipaa_consent ? `✓ ${formatDate(contact.hipaa_consent_date)}` : 'Not obtained'}
                </span>
              </div>
              {contact.license_states && contact.license_states.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Licensed States</span>
                  <span className="text-white">{contact.license_states.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Follow-up</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Next follow-up</span>
                <span className={contact.next_follow_up_at && new Date(contact.next_follow_up_at) < new Date() ? 'text-red-400 font-medium' : 'text-white'}>
                  {contact.next_follow_up_at ? (
                    `${new Date(contact.next_follow_up_at) < new Date() ? '⚠ ' : ''}${formatDate(contact.next_follow_up_at)}`
                  ) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last contacted</span>
                <span className="text-white">{formatRelative(contact.last_contacted_at)}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full">
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Activity */}
        <div className="lg:col-span-2 space-y-5">

          {/* Log Activity */}
          {!showLogForm ? (
            <button
              onClick={() => setShowLogForm(true)}
              className="w-full bg-gray-900 border border-gray-800 border-dashed rounded-xl p-4 text-sm text-gray-500 hover:text-white hover:border-gray-600 transition-colors"
            >
              + Log activity — call, email, meeting, note
            </button>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Log Activity</h3>

              {/* Activity type buttons */}
              <div className="flex gap-2 flex-wrap">
                {['call', 'email_sent', 'meeting', 'note', 'sms_sent', 'follow_up', 'sample_sent', 'proposal_sent'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      actType === t
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    {ACTIVITY_ICONS[t]} {t.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Subject (optional)"
                value={actSubject}
                onChange={e => setActSubject(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <textarea
                placeholder="Notes, outcome, next steps..."
                value={actBody}
                onChange={e => setActBody(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />

              <div className="grid grid-cols-3 gap-3">
                {(actType === 'call' || actType === 'meeting') && (
                  <input
                    type="number"
                    placeholder="Duration (mins)"
                    value={actDuration}
                    onChange={e => setActDuration(e.target.value)}
                    className="bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                <input
                  type="text"
                  placeholder="Outcome"
                  value={actOutcome}
                  onChange={e => setActOutcome(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Next follow-up</label>
                  <input
                    type="date"
                    value={actFollowUp}
                    onChange={e => setActFollowUp(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogForm(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={logActivity}
                  disabled={saving || !actBody.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Log Activity'}
                </button>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Activity Timeline</h3>
              <p className="text-xs text-gray-500 mt-0.5">{activities.length} activities</p>
            </div>
            {activities.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-600">No activity logged yet.</p>
                <p className="text-xs text-gray-700 mt-1">Log a call, email, or note above.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {activities.map(a => (
                  <div key={a.id} className="px-5 py-4 flex gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-sm ${ACTIVITY_COLORS[a.type] || 'bg-gray-500/10 text-gray-400'}`}>
                      {ACTIVITY_ICONS[a.type] || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white capitalize">
                          {a.type.replace(/_/g, ' ')}
                          {a.subject && <span className="text-gray-400 font-normal"> — {a.subject}</span>}
                        </p>
                        <span className="text-xs text-gray-600 shrink-0">{formatRelative(a.created_at)}</span>
                      </div>
                      {a.body && <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">{a.body}</p>}
                      {a.outcome && (
                        <span className="inline-block mt-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {a.outcome}
                        </span>
                      )}
                      {a.duration_minutes && (
                        <p className="text-xs text-gray-600 mt-1">{a.duration_minutes} min</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}