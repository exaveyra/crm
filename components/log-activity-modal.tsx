'use client'

import { useState } from 'react'

type ActivityType =
  | 'call' | 'email_sent' | 'email_received' | 'meeting'
  | 'demo' | 'proposal_sent' | 'note' | 'follow_up' | 'sample_sent'

interface LogActivityModalProps {
  contactId: string
  onClose: () => void
  onSaved: () => void
}

const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'call',           label: 'Phone Call',       icon: '📞' },
  { value: 'email_sent',     label: 'Email Sent',       icon: '📤' },
  { value: 'email_received', label: 'Email Received',   icon: '📥' },
  { value: 'meeting',        label: 'Meeting',          icon: '🤝' },
  { value: 'demo',           label: 'Demo',             icon: '🖥️' },
  { value: 'proposal_sent',  label: 'Proposal Sent',    icon: '📄' },
  { value: 'note',           label: 'Note',             icon: '📝' },
  { value: 'follow_up',      label: 'Follow-up',        icon: '🔔' },
  { value: 'sample_sent',    label: 'Sample Sent',      icon: '📦' },
]

const OUTCOMES = [
  'Positive - moving forward',
  'Neutral - follow up needed',
  'No answer - left voicemail',
  'Not interested',
  'Already using competitor',
  'Requested more info',
  'Meeting scheduled',
  'Proposal requested',
]

export function LogActivityModal({
  contactId,
  onClose,
  onSaved,
}: LogActivityModalProps) {
  const [type, setType] = useState<ActivityType>('call')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [outcome, setOutcome] = useState('')
  const [duration, setDuration] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          type,
          subject: subject || ACTIVITY_TYPES.find(a => a.value === type)?.label,
          body: body || null,
          outcome: outcome || null,
          duration_minutes: duration ? parseInt(duration) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to log activity')
      }

      // Update follow-up date if set
      if (followUpDate) {
        await fetch(`/api/contacts/${contactId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ next_follow_up_at: followUpDate }),
        })
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Log Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Activity type grid */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Activity Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITY_TYPES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setType(a.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    type === a.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span>{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Subject <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`e.g. ${ACTIVITY_TYPES.find(a => a.value === type)?.label} with Dr. Smith`}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Notes
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="What was discussed? Key points, objections, next steps..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Outcome */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select outcome...</option>
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            {['call', 'meeting', 'demo'].includes(type) && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  max="480"
                  placeholder="e.g. 30"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Follow-up date */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Schedule Follow-up <span className="text-gray-600">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {saving ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
