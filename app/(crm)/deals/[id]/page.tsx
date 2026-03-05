'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogActivityModal } from '@/components/log-activity-modal'
import { PageHeader } from '@/components/page-header'

const STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

const STAGE_COLORS: Record<string, string> = {
  prospecting:   'text-gray-400 bg-gray-500/10 border-gray-700',
  qualification: 'text-blue-400 bg-blue-500/10 border-blue-800',
  proposal:      'text-violet-400 bg-violet-500/10 border-violet-800',
  negotiation:   'text-amber-400 bg-amber-500/10 border-amber-800',
  closed_won:    'text-emerald-400 bg-emerald-500/10 border-emerald-800',
  closed_lost:   'text-red-400 bg-red-500/10 border-red-800',
}

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞', email_sent: '📤', email_received: '📥',
  meeting: '🤝', demo: '🖥️', proposal_sent: '📄',
  note: '📝', follow_up: '🔔', sample_sent: '📦',
  stage_change: '➡️',
}

interface Deal {
  id: string
  title: string
  stage: string
  value: number | null
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null
  products_interest: string[]
  description: string | null
  notes: string | null
  lost_reason: string | null
  created_at: string
  contact: { id: string; first_name: string; last_name: string; email: string | null; phone: string | null } | null
  organization: { id: string; name: string; city: string | null; state: string | null } | null
}

interface Activity {
  id: string
  type: string
  subject: string | null
  body: string | null
  outcome: string | null
  duration_minutes: number | null
  created_at: string
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelative(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(d)
}

export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()
  const supabase = createClient()

  const [deal, setDeal] = useState<Deal | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogModal, setShowLogModal] = useState(false)
  const [updatingStage, setUpdatingStage] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: d }, { data: a }] = await Promise.all([
      supabase
        .from('deals')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, phone),
          organization:organizations(id, name, city, state)
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('activities')
        .select('*')
        .eq('deal_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setDeal(d as Deal)
    setActivities((a as Activity[]) || [])
    setLoading(false)
  }

  async function moveStage(newStage: string) {
    setUpdatingStage(true)
    await supabase.from('deals').update({ stage: newStage }).eq('id', id)
    // Log stage change activity
    if (deal?.contact_id) {
      await supabase.from('activities').insert({
        deal_id: id,
        contact_id: (deal as any).contact_id,
        type: 'stage_change',
        subject: `Stage moved to ${newStage.replace(/_/g, ' ')}`,
      })
    }
    setUpdatingStage(false)
    load()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>
  }

  if (!deal) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Deal not found.</p></div>
  }

  const currentStageIdx = STAGES.indexOf(deal.stage)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={deal.title}
        subtitle={`${deal.stage.replace(/_/g, ' ')} · ${deal.value ? `$${deal.value.toLocaleString()}` : 'No value'} · ${deal.probability}% probability`}
        action={
          <button onClick={() => router.push('/deals')} className="text-gray-500 hover:text-white text-sm transition-colors">
            ← Back
          </button>
        }
      />

      {/* Stage Progress Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Stage Progress</p>
        <div className="flex items-center gap-1">
          {STAGES.filter(s => !['closed_lost'].includes(s)).map((stage, i) => {
            const isActive = deal.stage === stage
            const isPast = currentStageIdx > i && deal.stage !== 'closed_lost'
            return (
              <button
                key={stage}
                onClick={() => moveStage(stage)}
                disabled={updatingStage}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  isActive
                    ? `${STAGE_COLORS[stage]} border-current`
                    : isPast
                    ? 'bg-emerald-500/5 text-emerald-700 border-emerald-900 hover:text-emerald-400'
                    : 'bg-gray-800 text-gray-600 border-gray-700 hover:text-gray-400'
                }`}
              >
                {stage.replace(/_/g, ' ')}
              </button>
            )
          })}
        </div>
        {deal.stage !== 'closed_lost' && (
          <button
            onClick={() => moveStage('closed_lost')}
            disabled={updatingStage}
            className="mt-2 w-full py-1.5 text-xs text-red-600 hover:text-red-400 border border-red-900 hover:border-red-700 rounded-lg transition-colors"
          >
            Mark as Lost
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 text-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Details</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Value</span>
              <span className="text-emerald-400 font-semibold">
                {deal.value ? `$${deal.value.toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Probability</span>
              <span className="text-white">{deal.probability}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Weighted Value</span>
              <span className="text-amber-400">
                {deal.value ? `$${Math.round(deal.value * deal.probability / 100).toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expected Close</span>
              <span className="text-white">{formatDate(deal.expected_close_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created</span>
              <span className="text-white">{formatDate(deal.created_at)}</span>
            </div>
          </div>

          {/* Contact */}
          {deal.contact && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact</h3>
              <Link href={`/contacts/${deal.contact.id}`} className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/30 flex items-center justify-center">
                  <span className="text-indigo-300 text-xs font-bold">
                    {deal.contact.first_name[0]}{deal.contact.last_name[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                    {deal.contact.first_name} {deal.contact.last_name}
                  </p>
                  {deal.contact.email && <p className="text-xs text-gray-500">{deal.contact.email}</p>}
                </div>
              </Link>
            </div>
          )}

          {/* Organization */}
          {deal.organization && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Organization</h3>
              <Link href={`/organizations/${deal.organization.id}`} className="text-sm text-white hover:text-indigo-300 transition-colors font-medium">
                {deal.organization.name}
              </Link>
              {(deal.organization.city || deal.organization.state) && (
                <p className="text-xs text-gray-500 mt-1">
                  {[deal.organization.city, deal.organization.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Products */}
          {deal.products_interest && deal.products_interest.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Products</h3>
              <div className="flex flex-wrap gap-1.5">
                {deal.products_interest.map(p => (
                  <span key={p} className="text-xs bg-indigo-600/10 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-full">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {deal.notes && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Activity */}
        <div className="lg:col-span-2 space-y-5">
          <button
            onClick={() => setShowLogModal(true)}
            className="w-full bg-gray-900 border border-gray-800 border-dashed rounded-xl p-4 text-sm text-gray-500 hover:text-white hover:border-gray-600 transition-colors"
          >
            + Log activity on this deal
          </button>

          {showLogModal && deal.contact && (
            <LogActivityModal
              contactId={(deal as any).contact_id}
              onClose={() => setShowLogModal(false)}
              onSaved={() => { setShowLogModal(false); load() }}
            />
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Activity Timeline</h3>
              <p className="text-xs text-gray-500 mt-0.5">{activities.length} activities</p>
            </div>
            {activities.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-600">No activity yet on this deal.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {activities.map(a => (
                  <div key={a.id} className="px-5 py-4 flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 text-sm">
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
                      {a.body && <p className="text-sm text-gray-400 mt-1">{a.body}</p>}
                      {a.outcome && (
                        <span className="inline-block mt-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {a.outcome}
                        </span>
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
  )
}
