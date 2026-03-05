"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

type TeamMember = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

const ROLES = ["admin", "sales", "medical", "staff"];

export default function SettingsPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    const res = await fetch("/api/team");
    const data = await res.json();
    setTeam(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
        password: invitePassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create team member.");
    } else {
      setMessage(`Team member ${inviteName} added successfully.`);
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      setInviteRole("staff");
      fetchTeam();
    }
    setSaving(false);
  }

  const roleColor: Record<string, string> = {
    admin: "bg-red-500/10 text-red-400",
    sales: "bg-blue-500/10 text-blue-400",
    medical: "bg-teal-500/10 text-teal-400",
    staff: "bg-slate-500/10 text-slate-400",
  };

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Manage your team and account settings"
      />

      {/* Team Members */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Team Members</h3>
        {loading ? (
          <p className="text-slate-500 text-sm">Loading team...</p>
        ) : team.length === 0 ? (
          <p className="text-slate-500 text-sm">No team members yet.</p>
        ) : (
          <div className="space-y-3">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                    {member.full_name?.[0] || member.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {member.full_name || "—"}
                    </p>
                    <p className="text-slate-500 text-xs">{member.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${roleColor[member.role] || "bg-slate-500/10 text-slate-400"}`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Team Member */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Add Team Member</h3>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Full Name</label>
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="jane@exaveyra.com"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1.5">Temporary Password</label>
              <input
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition"
          >
            {saving ? "Adding..." : "Add Team Member"}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Account</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Company</span>
            <span className="text-white text-sm">ExaVeyra Sciences</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Plan</span>
            <span className="text-teal-400 text-sm font-medium">Internal CRM</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Environment</span>
            <span className="text-amber-400 text-sm">Development</span>
          </div>
        </div>
      </div>
    </div>
  );
}