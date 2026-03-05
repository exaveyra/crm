'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'sales_manager' | 'sales_rep';
  title: string;
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sales_manager: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  sales_rep: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

function formatRelative(dateStr?: string) {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function TeamPage() {
  const [team, setTeam] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const [invite, setInvite] = useState({
    email: '',
    full_name: '',
    role: 'sales_rep',
    title: '',
  });

  useEffect(() => { loadTeam(); }, []);

  async function loadTeam() {
    setLoading(true);
    const res = await fetch('/api/team');
    const data = await res.json();
    setTeam(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function sendInvite() {
    if (!invite.email || !invite.full_name) {
      setInviteError('Email and name are required.');
      return;
    }
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invite),
    });
    const data = await res.json();

    if (!res.ok) {
      setInviteError(data.error || 'Invite failed.');
      setInviting(false);
      return;
    }

    setInviteSuccess(`✓ Invite sent to ${invite.email}`);
    setInvite({ email: '', full_name: '', role: 'sales_rep', title: '' });
    setInviting(false);
    loadTeam();
  }

  async function updateRole(id: string, role: string) {
    await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    });
    loadTeam();
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    });
    loadTeam();
  }

  const activeCount = team.filter(t => t.is_active).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      <PageHeader
        title="Team"
        subtitle={`${activeCount} active member${activeCount !== 1 ? 's' : ''}`}
        action={
          <button
            onClick={() => { setShowInvite(true); setInviteSuccess(''); setInviteError(''); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Invite Member
          </button>
        }
      />

      {/* Invite Form */}
      {showInvite && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Invite Team Member</h2>
          <p className="text-xs text-gray-500">
            They'll receive an email with a magic link to set their password and access the CRM.
          </p>

          {inviteError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-lg">
              {inviteSuccess}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Full Name *</label>
              <input
                value={invite.full_name}
                onChange={e => setInvite(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Sarah Chen"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Email *</label>
              <input
                type="email"
                value={invite.email}
                onChange={e => setInvite(p => ({ ...p, email: e.target.value }))}
                placeholder="sarah@exaveyra.com"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Role</label>
              <select
                value={invite.role}
                onChange={e => setInvite(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="sales_rep">Sales Rep</option>
                <option value="sales_manager">Sales Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Title</label>
              <input
                value={invite.title}
                onChange={e => setInvite(p => ({ ...p, title: e.target.value }))}
                placeholder="Regional Sales Manager"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={sendInvite}
              disabled={inviting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      )}

      {/* Team Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Team Members</h2>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">Loading team...</div>
        ) : team.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-500 text-sm">No team members yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {team.map(member => (
              <div key={member.id} className="px-6 py-4 flex items-center gap-4">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {member.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{member.full_name || 'Unnamed'}</span>
                    {!member.is_active && (
                      <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {member.email}
                    {member.title && <span className="text-gray-600"> · {member.title}</span>}
                  </p>
                </div>

                {/* Last seen */}
                <div className="text-xs text-gray-600 shrink-0 hidden sm:block">
                  {member.last_seen_at ? formatRelative(member.last_seen_at) : 'Never logged in'}
                </div>

                {/* Role selector */}
                <select
                  value={member.role}
                  onChange={e => updateRole(member.id, e.target.value)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border bg-transparent focus:outline-none cursor-pointer ${ROLE_COLORS[member.role]}`}
                >
                  <option value="sales_rep">Sales Rep</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="admin">Admin</option>
                </select>

                {/* Active toggle */}
                <button
                  onClick={() => toggleActive(member.id, member.is_active)}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                    member.is_active
                      ? 'border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-500/30'
                      : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {member.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How invites work */}
      <div className="bg-gray-900/50 border border-gray-800 border-dashed rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">How Invites Work</h3>
        <div className="space-y-1.5 text-sm text-gray-500">
          <p>1. Enter your team member's name, email, and role above.</p>
          <p>2. They receive an email with a secure magic link (valid 24 hours).</p>
          <p>3. They click the link, set a password, and land directly on the dashboard.</p>
          <p>4. Their profile appears in this table immediately — you can update their role anytime.</p>
        </div>
      </div>

    </div>
  );
}