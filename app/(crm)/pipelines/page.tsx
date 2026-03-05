'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'

type LeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'proposal'
  | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurture'

interface Contact {
  id: string
  first_name: string
  last_name: string
  practice_name: string | null
  lead_status: LeadStatus
  lead_score: number
  estimated_monthly_value: number | null
  contact_type: string | null
  next_follow_up_at: string | null
}

const STAGES: { status: LeadStatus; label: string; color: string; accent: string }[] = [
  { status: 'new',         label: 'New',         color: 'border-gray-700',    accent: 'bg-gray-500' },
  { status: 'contacted',   label: 'Contacted',   color: 'border-blue-800',    accent: 'bg-blue-500' },
  { status: 'qualified',   label: 'Qualified',   color: 'border-indigo-800',  accent: 'bg-indigo-500' },
  { status: 'proposal',    label: 'Proposal',    color: 'border-violet-800',  accent: 'bg-violet-500' },
  { status: 'negotiation', label: 'Negotiation', color: 'border-amber-800',   accent: 'bg-amber-500' },
  { status: 'closed_won',  label: 'Closed Won',  color: 'border-emerald-800', accent: 'bg-emerald-500' },
]

function formatCurrency(val?: number | null) {
  if (!val) return null
  return `$${val.toLocaleString()}/mo`
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 45) return 'text-amber-400'
  return 'text-blue-400'
}

function ContactCard({
  contact,
  onDrop,
}: {
  contact: Contact
  onDrop: (id: string, status: LeadStatus) => void
}) {
  const isOverdue = contact.next_follow_up_at
    ? new Date(contact.next_follow_up_at) < new Date()
    : false

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('contactId', contact.id)}
      className="bg-gray-800 border border-gray-700 rounded-xl p-3.5 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-colors group"
    >
      <Link href={`/contacts/${contact.id}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
              {contact.first_name} {contact.last_name}
            </p>
            {contact.practice_name && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{contact.practice_name}</p>
            )}
          </div>
          <span className={`text-xs font-bold shrink-0 ${scoreColor(contact.lead_score)}`}>
            {contact.lead_score}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          {contact.estimated_monthly_value ? (
            <span className="text-xs text-emerald-400 font-medium">
              {formatCurrency(contact.estimated_monthly_value)}
            </span>
          ) : (
            <span className="text-xs text-gray-700">—</span>
          )}
          {isOverdue && (
            <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
              ⚠ Overdue
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}

function KanbanColumn({
  stage,
  contacts,
  onDrop,
}: {
  stage: typeof STAGES[0]
  contacts: Contact[]
  onDrop: (id: string, status: LeadStatus) => void
}) {
  const [isDragOver, setIsDragOver] = useState(false)

  const totalValue = contacts.reduce(
    (sum, c) => sum + (c.estimated_monthly_value || 0), 0
  )

  return (
    <div
      className={`flex flex-col min-w-[220px] w-[220px] rounded-xl border ${stage.color} ${
        isDragOver ? 'bg-gray-800/60' : 'bg-gray-900/60'
      } transition-colors`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        const contactId = e.dataTransfer.getData('contactId')
        if (contactId) onDrop(contactId, stage.status)
      }}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.accent}`} />
          <span className="text-xs font-semibold text-gray-300">{stage.label}</span>
          <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full">
            {contacts.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-emerald-400">${totalValue.toLocaleString()}</span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[120px]">
        {contacts.length === 0 ? (
          <div className="flex items-center justify-center h-16">
            <p className="text-xs text-gray-700">Drop here</p>
          </div>
        ) : (
          contacts.map((c) => (
            <ContactCard key={c.id} contact={c} onDrop={onDrop} />
          ))
        )}
      </div>
    </div>
  )
}

export default function PipelinesPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    setLoading(true)
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, practice_name, lead_status, lead_score, estimated_monthly_value, contact_type, next_follow_up_at')
      .not('lead_status', 'in', '("closed_lost","do_not_contact","nurture")')
      .order('lead_score', { ascending: false })

    setContacts((data as Contact[]) || [])
    setLoading(false)
  }

  async function moveContact(contactId: string, newStatus: LeadStatus) {
    // Optimistic update
    setContacts(prev =>
      prev.map(c => c.id === contactId ? { ...c, lead_status: newStatus } : c)
    )
    await supabase
      .from('contacts')
      .update({ lead_status: newStatus })
      .eq('id', contactId)
  }

  const contactsByStage = (status: LeadStatus) =>
    contacts.filter(c => c.lead_status === status)

  const totalPipelineValue = contacts
    .filter(c => !['new', 'closed_lost'].includes(c.lead_status))
    .reduce((sum, c) => sum + (c.estimated_monthly_value || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">Loading pipeline...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pipeline"
        subtitle={`${contacts.length} active contacts · $${totalPipelineValue.toLocaleString()}/mo pipeline value`}
        action={
          <Link
            href="/contacts/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            + Add Contact
          </Link>
        }
      />

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage.status}
            stage={stage}
            contacts={contactsByStage(stage.status)}
            onDrop={moveContact}
          />
        ))}
      </div>

      <p className="text-xs text-gray-700 text-center">
        Drag cards between columns to update lead status
      </p>
    </div>
  )
}
