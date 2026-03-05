'use client';
import React, { useState, useEffect } from 'react';

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
};

type Props = {
  currentAssigneeId?: string | null;
  onAssign: (userId: string | null) => void;
  size?: 'sm' | 'md';
};

export default function AssigneePicker({ currentAssigneeId, onAssign, size = 'md' }: Props) {
  const [team, setTeam] = useState<Profile[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/team')
      .then(r => {
        if (!r.ok) return [];
        return r.json();
      })
      .then(data => setTeam(Array.isArray(data) ? data.filter((p: Profile) => p.is_active) : []))
      .catch(() => setTeam([]));
  }, []);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value || null;
    setSaving(true);
    await onAssign(val);
    setSaving(false);
  }

  const current = team.find(t => t.id === currentAssigneeId);

  return (
    <div className="flex items-center gap-2">
      {current && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-semibold">
            {current.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      <select
        value={currentAssigneeId || ''}
        onChange={handleChange}
        disabled={saving}
        className={`bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
          size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
        }`}
      >
        <option value="">Unassigned</option>
        {team.map(member => (
          <option key={member.id} value={member.id}>
            {member.full_name || member.email}
          </option>
        ))}
      </select>
    </div>
  );
}