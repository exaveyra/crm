'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'
import { PageHeader } from '@/components/page-header'

const STAGES = [
  { value: 'prospecting',   label: 'Prospecting' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal',      label: 'Proposal' },
  { value: 'negotiation',   label: 'Negotiation' },
  { value: 'closed_won',    label: 'Closed Won' },
  { value: 'closed_lost',   label: 'Closed Lost' },
]

const PRODUCTS = [
  'Exosomes 50B', 'Exosomes 140B', 'Exosomes 350B', 'Exosomes 700B',
  'Lyophilized Exosomes', 'Peptides', 'LED Plasma Activator',
  'Shockwave Device', 'Radiance RF', 'Custom Compounding',
]

function NewDealForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    title: '',
    stage: 'prospecting',
    contact_id: '',
    organization_id: searchParams.get('org_id') || '',
    value: '',
    probability: '50',
    expected_close_date: '',
    products_interest: [] as string[],
    description: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([
      supabase.from('contacts').select('id, first_name, last_name').order('last_name'),
      supabase.from('organizations').select('id, name').order('name'),
    ]).then(([{ data: c }, { data: o }]) => {
      setContacts(c || [])
      setOrganizations(o || [])
    })
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleProduct(product: string) {
    setForm(prev => ({
      ...prev,
      products_interest: prev.products_interest.includes(product)
        ? prev.products_interest.filter(p => p !== product)
        : [...prev.products_interest, product],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Deal title is required'); return }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          stage: form.stage,
          contact_id: form.contact_id || null,
          organization_id: form.organization_id || null,
          value: form.value ? parseFloat(form.value) : null,
          probability: form.probability ? parseInt(form.probability) : 50,
          expected_close_date: form.expected_close_date || null,
          products_interest: form.products_interest,
          description: form.description || null,
          notes: form.notes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create deal')
      }

      const { data } = await res.json()
      router.push(`/deals/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="New Deal"
        subtitle="Create a new sales opportunity"
        action={
          <button onClick={() => router.back()} className="text-gray-500 hover:text-white transition-colors text-sm">
            ← Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Core */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Info</h2>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Deal Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Miami Wellness — Exosomes Q2"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Stage</label>
              <select
                value={form.stage}
                onChange={e => set('stage', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Win Probability (%)</label>
              <input
                type="number"
                value={form.probability}
                onChange={e => set('probability', e.target.value)}
                min="0" max="100"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Value ($)</label>
              <input
                type="number"
                value={form.value}
                onChange={e => set('value', e.target.value)}
                placeholder="e.g. 12000"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Expected Close Date</label>
              <input
                type="date"
                value={form.expected_close_date}
                onChange={e => set('expected_close_date', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Link To</h2>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Contact</label>
            <select
              value={form.contact_id}
              onChange={e => set('contact_id', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select contact (optional)...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Organization</label>
            <select
              value={form.organization_id}
              onChange={e => set('organization_id', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select organization (optional)...</option>
              {organizations.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Products */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Products of Interest</h2>
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => toggleProduct(p)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  form.products_interest.includes(p)
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes</h2>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Deal context, requirements, key decision makers..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? 'Saving...' : 'Create Deal'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>}>
      <NewDealForm />
    </Suspense>
  )
}
