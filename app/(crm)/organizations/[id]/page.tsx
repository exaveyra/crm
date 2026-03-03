'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  type: string | null
  website: string | null
  phone: string | null
  email: string | null
  address_line1: string | null
  city: string | null
  state: string | null
  zip: string | null
  num_providers: number | null
  annual_revenue_estimate: number | null
  buying_group: string | null
  tags: string[] | null
  notes: string | null
  created_at: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  contact_type: string | null
  lead_status: string | null
  lead_score: number
  email: string | null
}

interface Deal {
  id: string
  title: string
  stage: string
  value: number | null
  expected_close_date: string | null
}

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const router = useRouter()
  const supabase = createClient()

  const [org, setOrg] = useState<Organization | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [linkEmail, setLinkEmail] = useState('')
  const [linkError, setLinkError] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: o }, { data: co }, { data: d }] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', id).single(),
      supabase
        .from('contact_organizations')
        .select('contact:contacts(id, first_name, last_name, contact_type, lead_status, lead_score, email)')
        .eq('organization_id', id),
      supabase.from('deals').select('id, title, stage, value, expected_close_date').eq('organization_id', id),
    ])
    setOrg(o as Organization)
    setContacts((co?.map((r: any) => r.contact) as Contact[]) || [])
    setDeals((d as Deal[]) || [])
    setLoading(false)
  }

  async function linkContact(e: React.FormEvent) {
    e.preventDefault()
    setLinkError('')
    const { data: c } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', linkEmail.trim())
      .single()

    if (!c) { setLinkError('No contact found with that email.'); return }

    const { error } = await supabase
      .from('contact_organizations')
      .upsert({ contact_id: c.id, organization_id: id })

    if (error) { setLinkError(error.message); return }
    setLinkEmail('')
    load()
  }

  async function unlinkContact(contactId: string) {
    await supabase
      .from('contact_organizations')
      .delete()
      .eq('contact_id', contactId)
      .eq('organization_id', id)
    load()
  }

  function stageColor(stage: string) {
    const map: Record<string, string> = {
      prospecting: 'text-gray-400',
      qualification: 'text-blue-400',
      proposal: 'text-violet-400',
      negotiation: 'text-amber-400',
      closed_won: 'text-emerald-400',
      closed_lost: 'text-red-400',
    }
    return map[stage] || 'text-gray-400'
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>
  }

  if (!org) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Organization not found.</p></div>
  }

  const totalDealValue = deals.reduce((sum, d) => sum + (d.value || 0), 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/organizations')} className="text-gray-500 hover:text-white transition-colors text-sm">← Back</button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-lg font-bold">{org.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">{org.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5 capitalize">{org.type?.replace(/_/g, ' ') || 'Organization'}</p>
          </div>
        </div>
        <Link
          href={`/deals/new?org_id=${id}&org_name=${encodeURIComponent(org.name)}`}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          + New Deal
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Org Info */}
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 text-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</h3>
            {org.phone && (
              <a href={`tel:${org.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-white">
                <span className="text-gray-600">📞</span>{org.phone}
              </a>
            )}
            {org.email && (
              <a href={`mailto:${org.email}`} className="flex items-center gap-3 text-gray-300 hover:text-white">
                <span className="text-gray-600">📧</span>{org.email}
              </a>
            )}
            {org.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300">
                <span className="text-gray-600">🌐</span>{org.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {(org.city || org.state) && (
              <div className="flex items-center gap-3 text-gray-300">
                <span className="text-gray-600">📍</span>
                {[org.address_line1, org.city, org.state, org.zip].filter(Boolean).join(', ')}
              </div>
            )}
            <div className="pt-2 border-t border-gray-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Providers</span>
                <span className="text-white">{org.num_providers ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Est. Revenue</span>
                <span className="text-emerald-400">
                  {org.annual_revenue_estimate ? `$${org.annual_revenue_estimate.toLocaleString()}` : '—'}
                </span>
              </div>
              {org.buying_group && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Buying Group</span>
                  <span className="text-white">{org.buying_group}</span>
                </div>
              )}
            </div>
          </div>

          {org.notes && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{org.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Contacts + Deals */}
        <div className="lg:col-span-2 space-y-5">
          {/* Deals */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Deals</h3>
              {totalDealValue > 0 && (
                <span className="text-xs text-emerald-400">${totalDealValue.toLocaleString()} total</span>
              )}
            </div>
            <div className="divide-y divide-gray-800">
              {deals.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-gray-600">No deals yet.</p>
                  <Link
                    href={`/deals/new?org_id=${id}&org_name=${encodeURIComponent(org.name)}`}
                    className="text-indigo-400 text-sm hover:underline mt-1 inline-block"
                  >
                    Create first deal →
                  </Link>
                </div>
              ) : (
                deals.map(deal => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{deal.title}</p>
                      <p className={`text-xs capitalize mt-0.5 ${stageColor(deal.stage)}`}>
                        {deal.stage.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-400">
                        {deal.value ? `$${deal.value.toLocaleString()}` : '—'}
                      </p>
                      {deal.expected_close_date && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Close {new Date(deal.expected_close_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Contacts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Contacts ({contacts.length})</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {contacts.length === 0 ? (
                <div className="px-5 py-4 text-sm text-gray-600">No contacts linked yet.</div>
              ) : (
                contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                    <Link href={`/contacts/${c.id}`} className="flex items-center gap-3 group">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center">
                        <span className="text-indigo-300 text-xs font-bold">
                          {c.first_name[0]}{c.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {c.contact_type?.replace(/_/g, ' ')} · Score {c.lead_score}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => unlinkContact(c.id)}
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                    >
                      Unlink
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Link contact by email */}
            <div className="px-5 py-4 border-t border-gray-800">
              <form onSubmit={linkContact} className="flex gap-2">
                <input
                  type="email"
                  value={linkEmail}
                  onChange={e => setLinkEmail(e.target.value)}
                  placeholder="Link contact by email..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
                >
                  Link
                </button>
              </form>
              {linkError && <p className="text-red-400 text-xs mt-1.5">{linkError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
