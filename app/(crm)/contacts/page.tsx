'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  contact_type: string;
  specialty: string;
  practice_name: string;
  city: string;
  state: string;
  lead_status: string;
  lead_score: number;
  npi_verified: boolean;
  estimated_monthly_value: number;
  last_contacted_at: string;
  next_follow_up_at: string;
  tags: string[];
};

const TYPE_COLORS: Record<string, string> = {
  regenerative_md:  'bg-violet-500/20 text-violet-300',
  aesthetics_md:    'bg-pink-500/20 text-pink-300',
  prescriber:       'bg-blue-500/20 text-blue-300',
  clinic_admin:     'bg-cyan-500/20 text-cyan-300',
  patient:          'bg-green-500/20 text-green-300',
  prospect:         'bg-gray-500/20 text-gray-400',
  vendor:           'bg-orange-500/20 text-orange-300',
  referral_partner: 'bg-yellow-500/20 text-yellow-300',
};

const STATUS_COLORS: Record<string, string> = {
  new:            'bg-sky-500/20 text-sky-300',
  contacted:      'bg-blue-500/20 text-blue-300',
  qualified:      'bg-indigo-500/20 text-indigo-300',
  proposal:       'bg-purple-500/20 text-purple-300',
  negotiation:    'bg-amber-500/20 text-amber-300',
  closed_won:     'bg-emerald-500/20 text-emerald-300',
  closed_lost:    'bg-red-500/20 text-red-300',
  nurture:        'bg-teal-500/20 text-teal-300',
  do_not_contact: 'bg-gray-500/20 text-gray-500',
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70
    ? 'bg-emerald-500/20 text-emerald-300'
    : score >= 45
    ? 'bg-amber-500/20 text-amber-300'
    : 'bg-gray-500/20 text-gray-400';
  const label = score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${color}`}>
      {score} <span className="font-normal opacity-70">{label}</span>
    </span>
  );
}

function formatCurrency(val?: number) {
  if (!val) return '—';
  return `$${val.toLocaleString()}`;
}

function formatRelative(dateStr?: string) {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr?: string) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function ContactsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState('lead_score');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  useEffect(() => {
    fetchContacts();
  }, [search, typeFilter, statusFilter, overdueOnly, sortBy, page]);

  async function fetchContacts() {
    setLoading(true);

    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('dnc_flag', false);

    if (search.trim()) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,practice_name.ilike.%${search}%,npi_number.ilike.%${search}%`
      );
    }
    if (typeFilter !== 'all') query = query.eq('contact_type', typeFilter);
    if (statusFilter !== 'all') query = query.eq('lead_status', statusFilter);
    if (overdueOnly) query = query.lt('next_follow_up_at', new Date().toISOString()).not('next_follow_up_at', 'is', null);

    query = query
      .order(sortBy, { ascending: sortBy === 'next_follow_up_at' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const { data, count } = await query;
    setContacts((data as Contact[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Contacts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total</p>
        </div>
        <button
          onClick={() => router.push('/contacts/new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-60 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search name, email, practice, NPI..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="regenerative_md">Regenerative MD</option>
          <option value="prescriber">Prescriber</option>
          <option value="aesthetics_md">Aesthetics MD</option>
          <option value="clinic_admin">Clinic Admin</option>
          <option value="patient">Patient</option>
          <option value="prospect">Prospect</option>
          <option value="vendor">Vendor</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed_won">Closed Won</option>
          <option value="nurture">Nurture</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="lead_score">Highest Score</option>
          <option value="created_at">Newest First</option>
          <option value="estimated_monthly_value">Highest Value</option>
          <option value="last_contacted_at">Recently Contacted</option>
          <option value="next_follow_up_at">Follow-up Due</option>
        </select>

        {/* Overdue toggle */}
        <button
          onClick={() => { setOverdueOnly(!overdueOnly); setPage(1); }}
          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
            overdueOnly
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          ⚠ Overdue Only
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {['Contact', 'Type', 'Practice', 'Status', 'Score', 'Value/mo', 'Last Contact', 'Follow-up'].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">
                    Loading contacts...
                  </td>
                </tr>
              )}
              {!loading && contacts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-600 text-sm">
                    No contacts found.{' '}
                    <button onClick={() => router.push('/contacts/new')} className="text-indigo-400 hover:underline">
                      Add your first contact
                    </button>
                  </td>
                </tr>
              )}
              {!loading && contacts.map(c => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/contacts/${c.id}`)}
                  className="hover:bg-gray-800/60 cursor-pointer transition-colors"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-semibold">
                          {c.first_name?.[0]}{c.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white whitespace-nowrap">
                          {c.first_name} {c.last_name}
                          {c.npi_verified && (
                            <span className="ml-1.5 text-emerald-400 text-xs">✓</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{c.email || '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${TYPE_COLORS[c.contact_type] || 'bg-gray-500/20 text-gray-400'}`}>
                      {c.contact_type?.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Practice */}
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-300 whitespace-nowrap">{c.practice_name || '—'}</p>
                    <p className="text-xs text-gray-600">{c.city}{c.state ? `, ${c.state}` : ''}</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[c.lead_status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {c.lead_status?.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3">
                    <ScoreBadge score={c.lead_score} />
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-emerald-400 font-medium">
                      {formatCurrency(c.estimated_monthly_value)}
                    </span>
                  </td>

                  {/* Last Contact */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">
                      {formatRelative(c.last_contacted_at)}
                    </span>
                  </td>

                  {/* Follow-up */}
                  <td className="px-4 py-3">
                    {c.next_follow_up_at ? (
                      <span className={`text-xs font-medium ${isOverdue(c.next_follow_up_at) ? 'text-red-400' : 'text-gray-400'}`}>
                        {isOverdue(c.next_follow_up_at) ? '⚠ ' : ''}{formatRelative(c.next_follow_up_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}